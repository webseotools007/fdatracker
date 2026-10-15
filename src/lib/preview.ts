import snapshot from "../../data/preview-records.json";
import { kinds,labels,type Kind,type RecordItem,type Role } from "./types";
import type { Analytics } from "./analytics";

export const previewDate=snapshot.asOf;
const storageKey="fda-manager-preview-v1";
let memory:RecordItem[]|undefined;
export function initialPreviewRecords():RecordItem[]{return structuredClone(snapshot.records) as unknown as RecordItem[];}
function records(){
 if(memory)return memory;
 try{const saved=sessionStorage.getItem(storageKey);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.length===snapshot.records.length)memory=parsed;}}catch{}
 return memory??=initialPreviewRecords();
}
const counts=(items:RecordItem[])=>Object.fromEntries(kinds.map(k=>[k,items.filter(r=>r.kind===k).length])) as Record<Kind,number>;
export function previewList(items:RecordItem[],role:Role,p:URLSearchParams){
 const visible=items.filter(r=>role==="admin"||r.status==="approved");
 const search=(p.get("q")||"").toLowerCase();
 const filtered=visible.filter(r=>(!p.get("kind")||r.kind===p.get("kind"))&&(!p.get("status")||p.get("status")==="all"||r.status===p.get("status"))&&(!p.get("since")||r.date>=p.get("since")!)&&(!p.get("until")||r.date<=p.get("until")!)&&(!search||[r.title,r.company,r.summary].some(v=>v.toLowerCase().includes(search)))).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const page=Math.max(1,Number(p.get("page"))||1);
 return {items:filtered.slice((page-1)*12,page*12),total:filtered.length,counts:counts(visible),pending:role==="admin"?visible.filter(r=>r.status==="pending").length:undefined};
}
export function previewAnalytics(items:RecordItem[],role:Role,months:number):Analytics{
 if(![3,6,12].includes(months))throw new Error("Choose a 3, 6 or 12 month chart window");
 const end=new Date(previewDate+"T00:00:00Z");
 const start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-months+1,1));
 const startDate=start.toISOString().slice(0,10);
 const visible=items.filter(r=>(role==="admin"||r.status==="approved")&&r.date>=startDate&&r.date<=previewDate);
 const series=Array.from({length:months},(_,i)=>{const month=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+i,1)).toISOString().slice(0,7);const subset=visible.filter(r=>r.date.startsWith(month));return {month,total:subset.length,counts:counts(subset)};});
 return {startDate,endDate:previewDate,months:series,total:visible.length,counts:counts(visible),companies:new Set(visible.map(r=>r.company.trim()).filter(Boolean)).size,latestDate:visible.map(r=>r.date).sort().at(-1)??null,referenceCount:visible.filter(r=>r.reference).length,scope:role==="admin"?"stored":"approved"};
}
export function previewDecision(items:RecordItem[],role:Role,body:{id:string;version:number;status:string;reason:string}){
 if(role!=="admin")throw new Error("Preview editor access required");
 if(!["approved","rejected"].includes(body.status)||typeof body.reason!=="string"||body.reason.trim().length<3||body.reason.length>1000)throw new Error("A decision and rationale are required");
 const item=items.find(r=>r.id===body.id);if(!item)throw new Error("Record not found");
 if(item.version!==body.version)throw new Error("This sample changed. Reload before reviewing.");
 item.status=body.status as RecordItem["status"];item.version++;
 return {saved:true};
}
export async function previewRequest<T>(role:Role,path:string,options?:RequestInit):Promise<T>{
 const [name,query]=path.split("?");const p=new URLSearchParams(query);
 const items=records();
 if(name==="session")return {redirect:"/"} as T;
 if(name==="records"&&options?.method==="PATCH"){
  const result=previewDecision(items,role,JSON.parse(String(options.body)));
  try{sessionStorage.setItem(storageKey,JSON.stringify(items));}catch{}
  return result as T;
 }
 if(name==="records")return previewList(items,role,p) as T;
 if(name==="analytics")return previewAnalytics(items,role,Number(p.get("months")||6)) as T;
 if(name==="sources"){
  if(role!=="admin")throw new Error("Preview editor access required");
  if(options?.method==="POST")throw new Error("Live collection is unavailable in this manager preview. No network request was made.");
  const urls={warning:"https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters","483":"https://www.fda.gov/about-fda/ora-electronic-reading-room",recall:"https://open.fda.gov/apis/drug/enforcement/",approval:"https://open.fda.gov/apis/drug/drugsfda/"};
  return {items:kinds.map(kind=>({kind,label:labels[kind],url:urls[kind],note:"Public-source snapshot for demonstration. Live collection is not connected on this preview.",lastRun:null}))} as T;
 }
 throw new Error("Unavailable preview action");
}

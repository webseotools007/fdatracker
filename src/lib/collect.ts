import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { randomUUID } from "node:crypto";
import { db, saveRecord, validDate, officialUrl } from "./store";
import type { Incoming, Kind } from "./types";
export const sources:Record<Kind,{label:string;url:string;note:string}>={
 warning:{label:"FDA Warning Letters",url:"https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters",note:"Latest visible official table page, drug/biologic offices only; not a full historical archive."},
 "483":{label:"FDA OII Reading Room",url:"https://www.fda.gov/about-fda/office-inspections-and-investigations/oii-foia-electronic-reading-room",note:"Latest visible Form 483 table rows; RSS is checked first. Selected public releases only, not all inspections or all 483s."},
 recall:{label:"openFDA drug enforcement",url:"https://api.fda.gov/drug/enforcement.json?limit=100&sort=report_date:desc",note:"Latest 100 reported drug recall records. Report date differs from recall initiation date."},
 approval:{label:"openFDA Drugs@FDA",url:"https://api.fda.gov/drug/drugsfda.json?limit=100&sort=submissions.submission_status_date:desc",note:"Approved original and supplemental submissions from 100 recently updated applications; not a complete chronological approval feed."},
};
const iso=(s:string)=>{if(/^\d{8}$/.test(s))return s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6);const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?m[3]+"-"+m[1].padStart(2,"0")+"-"+m[2].padStart(2,"0"):s;};
export function parseRecalls(data:any):Incoming[]{
 if(!Array.isArray(data.results))throw new Error("Unexpected openFDA recall response");
 return data.results.flatMap((x:any)=>{const date=iso(x.report_date||"");if(!validDate(date)||!x.recall_number)return [];
 return [{externalId:"recall:"+x.recall_number,kind:"recall" as const,title:String(x.product_description||"Drug recall"),company:String(x.recalling_firm||"Not specified"),date,summary:String(x.reason_for_recall||"Reason not provided"),url:"https://api.fda.gov/drug/enforcement.json?search=recall_number:"+encodeURIComponent('"'+x.recall_number+'"'),source:"openFDA drug enforcement",reference:false,details:{"Recall number":String(x.recall_number),"Classification":String(x.classification||"Not assigned"),"Recall status":String(x.status||"Not provided"),"Recall initiated":iso(x.recall_initiation_date||"")||"Not provided","Date shown":"FDA report date","Dataset updated":String(data.meta?.last_updated||"Not provided"),"Distribution":String(x.distribution_pattern||"Not provided")}}];});
}
export function parseApprovals(data:any):Incoming[]{
 if(!Array.isArray(data.results))throw new Error("Unexpected Drugs@FDA response");
 return data.results.flatMap((x:any)=>(Array.isArray(x.submissions)?x.submissions:[]).flatMap((s:any)=>{
 const date=iso(s.submission_status_date||"");
 if(s.submission_status!=="AP"||!validDate(date)||!x.application_number||!s.submission_number||!s.submission_type)return [];
 const products=(x.products||[]).map((p:any)=>p.brand_name).filter(Boolean);
 const type=s.submission_type==="ORIG"?"Original approval":s.submission_type==="SUPPL"?"Supplement approval":s.submission_type+" approval";
 const name=Array.from(new Set(products)).join(", ")||x.application_number;
 return [{externalId:"approval:"+x.application_number+":"+s.submission_type+":"+s.submission_number,kind:"approval" as const,title:name+" · "+type,company:String(x.sponsor_name||"Not specified"),date,summary:type+" recorded for "+x.application_number+". "+(s.submission_type==="SUPPL"?"A supplement is a change to an existing application, not necessarily a new drug.":"Consult Drugs@FDA for the approved indication and application documents."),url:"https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo="+x.application_number.replace(/\D/g,""),source:"openFDA Drugs@FDA",reference:false,details:{"Application":String(x.application_number),"Submission":s.submission_type+" "+s.submission_number,"Approval type":type,"Date shown":"Submission approval date","Dataset updated":String(data.meta?.last_updated||"Not provided")}}];
 }));
}
export function parseWarnings(html:string):Incoming[]{
 const $=load(html),results:Incoming[]=[];
 $("table tbody tr").each((_,row)=>{
 const cells=$(row).find("td");if(cells.length<5)return;
 const company=cells.eq(2).text().trim(),office=cells.eq(3).text().trim(),subject=cells.eq(4).text().trim(),date=iso(cells.eq(1).text().trim());
 const href=cells.eq(2).find("a").attr("href");if(!href||!validDate(date)||!/Drug Evaluation|Biologics|CDER|CBER/i.test(office))return;
 const url=new URL(href,sources.warning.url).href;if(!officialUrl(url))return;
 results.push({externalId:"warning:"+url,kind:"warning",title:company+" · Warning Letter",company,date,summary:subject,url,source:"FDA Warning Letters",reference:false,details:{"Issuing office":office,"Posted date":iso(cells.eq(0).text().trim()),"Date shown":"Letter issue date"}});
 });
 if(!results.length)throw new Error("No drug/biologic warning-letter rows could be verified on this page. Parser or source access needs checking.");
 return results;
}
export function parse483(xml:string):Incoming[]{
 const doc=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(xml);
 const raw=doc.rss?.channel?.item;if(!raw)throw new Error("Reading Room RSS has no recognizable items");
 const items=Array.isArray(raw)?raw:[raw];
 const result:Incoming[]=items.flatMap((x:any)=>{
 const title=String(x.title||"");if(!/\b483\b/.test(title))return [];
 const url=String(x.link||"");if(!officialUrl(url))return [];
 const parsed=new Date(x.pubDate||"");if(Number.isNaN(parsed.valueOf()))return [];
 return [{externalId:"483:"+url,kind:"483" as const,title,company:title.split(/\.| - | – /)[0]||"See source",date:parsed.toISOString().slice(0,10),summary:load(String(x.description||"")).text().trim(),url,source:"FDA OII Reading Room RSS",reference:false,details:{"Date shown":"RSS publication date","Coverage":"Selected publicly released Form 483s only","Interpretation":"Inspection observations are not a final agency compliance determination"}}];
 });
 if(!result.length)throw new Error("Feed has no verifiable Form 483 entries; no records imported");
 return result;
}
export function parse483Table(html:string):Incoming[]{
 const $=load(html),records:Incoming[]=[];
 $("table tbody tr").each((_,row)=>{
   const cells=$(row).find("td");if(cells.length<8||cells.eq(3).text().trim()!=="483")return;
   const date=iso(cells.eq(0).text().trim()),company=cells.eq(1).text().trim(),link=cells.eq(3).find("a").attr("href");
   if(!validDate(date)||!company||!link)return;
   const url=new URL(link,sources["483"].url).href;if(!officialUrl(url))return;
   records.push({externalId:"483:"+url,kind:"483",title:company+" · Form 483",company,date,summary:"Publicly released inspection observations. See the original FDA document for the complete record. These observations are not a final agency compliance determination.",url,source:"FDA OII Electronic Reading Room",reference:false,details:{"FEI":cells.eq(2).text().trim()||"Not provided","Location":[cells.eq(4).text().trim(),cells.eq(5).text().trim()].filter(Boolean).join(", ")||"Not provided","Establishment":cells.eq(6).text().trim(),"Published":iso(cells.eq(7).text().trim()),"Date shown":"Reading Room record date"}});
 });
 if(!records.length)throw new Error("No valid Form 483 rows found in the Reading Room table");
 return records;
}
export async function collect(kind:Kind){
 const conn=db(),id=randomUUID();conn.prepare("INSERT INTO runs(id,kind,status,started_at) VALUES(?,?,'running',?)").run(id,kind,new Date().toISOString());
 let http:number|null=null;
 try{
 let rssRecords:Incoming[]|null=null,rssNote="";
 if(kind==="483"){
   try {
     const feed=await fetch("https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/ora-foia-electronic-reading-room/rss.xml",{signal:AbortSignal.timeout(12000),cache:"no-store"});
     if(!feed.ok)throw new Error("HTTP "+feed.status);
     rssRecords=parse483(await feed.text());
   }catch(e){rssNote="RSS unavailable or no identifiable 483 entries; used official HTML table fallback. ";}
 }
 const response=rssRecords?null:await fetch(sources[kind].url,{headers:{"User-Agent":"FDATracker-Preview/0.1","Accept":"application/json,application/rss+xml,text/html"},signal:AbortSignal.timeout(25000),cache:"no-store"});http=response?.status??200;
 if(response&&!response.ok)throw new Error("Official source returned HTTP "+response.status);
 const body=response?await response.text():"";if(body.length>12_000_000)throw new Error("Source response exceeded collection limit");
 const records=rssRecords||(kind==="recall"?parseRecalls(JSON.parse(body)):kind==="approval"?parseApprovals(JSON.parse(body)):kind==="warning"?parseWarnings(body):parse483Table(body));
 let changed=0;
 conn.exec("BEGIN IMMEDIATE");
 try {for(const item of records)if(saveRecord(item).changed)changed++;conn.exec("COMMIT");}catch(e){conn.exec("ROLLBACK");throw e;}
 conn.prepare("UPDATE runs SET status='success',finished_at=?,http_status=?,message=?,accepted=? WHERE id=?").run(new Date().toISOString(),http,rssNote+records.length+" records parsed; "+changed+" new or changed. All new/changed records await Admin approval.",records.length,id);
 return {id,kind,status:"success",parsed:records.length,changed};
 }catch(e){const message=e instanceof Error?e.message:"Collection failed";conn.prepare("UPDATE runs SET status='failed',finished_at=?,http_status=?,message=? WHERE id=?").run(new Date().toISOString(),http,message.slice(0,500),id);return {id,kind,status:"failed",message};}
}

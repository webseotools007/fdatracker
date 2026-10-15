import { db,validDate } from "./store";
import { kinds,type Kind,type Role } from "./types";
export type MonthlyPoint={month:string;total:number;counts:Record<Kind,number>};
export type Analytics={
 startDate:string;endDate:string;months:MonthlyPoint[];total:number;
 counts:Record<Kind,number>;companies:number;latestDate:string|null;referenceCount:number;
 scope:"approved"|"stored";
};
const zeroCounts=()=>Object.fromEntries(kinds.map(kind=>[kind,0])) as Record<Kind,number>;
/** Publication dates, not ingestion volume. Customer approval scope is applied before aggregation. */
export function getAnalytics(role:Role,months=6,asOf=new Date().toISOString().slice(0,10)):Analytics {
 if(![3,6,12].includes(months)||!validDate(asOf))throw new Error("Choose a 3, 6 or 12 month chart window");
 const end=new Date(asOf+"T00:00:00Z");
 const start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-months+1,1));
 const startDate=start.toISOString().slice(0,10);
 const series:MonthlyPoint[]=Array.from({length:months},(_,index)=>({
   month:new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+index,1)).toISOString().slice(0,7),
   total:0,counts:zeroCounts(),
 }));
 const where=" WHERE date>=? AND date<=?"+(role==="user"?" AND status='approved'":"");
 const rows=db().prepare("SELECT substr(date,1,7) AS month,kind,count(*) AS n FROM records"+where+" GROUP BY month,kind").all(startDate,asOf);
 const counts=zeroCounts();
 for(const row of rows){
   const point=series.find(p=>p.month===row.month),kind=row.kind as Kind;
   if(!point||!kinds.includes(kind))continue;
   point.counts[kind]=Number(row.n);point.total+=Number(row.n);counts[kind]+=Number(row.n);
 }
 const summary=db().prepare("SELECT count(DISTINCT nullif(trim(company),'')) AS companies,max(date) AS latest,sum(reference) AS references_count FROM records"+where).get(startDate,asOf)!;
 return {startDate,endDate:asOf,months:series,total:series.reduce((sum,p)=>sum+p.total,0),counts,
 companies:Number(summary.companies),latestDate:summary.latest?String(summary.latest):null,
 referenceCount:Number(summary.references_count||0),scope:role==="user"?"approved":"stored"};
}

"use client";
import { ArrowUpRight,BarChart3,CalendarDays,ChevronDown } from "lucide-react";
import { kinds,labels,type Kind } from "@/lib/types";
import type { Analytics } from "@/lib/analytics";
export const chartColors:Record<Kind,string>={warning:"#294b8d","483":"#60a0c5",recall:"#eab747",approval:"#05a786"};
const monthLabel=(month:string,long=false)=>new Date(month+"-01T00:00:00Z").toLocaleDateString("en-GB",{month:long?"long":"short",year:long?"numeric":undefined,timeZone:"UTC"});
export function Sparkline({values,color}:{values:number[];color:string}){
 const max=Math.max(1,...values);
 const points=values.map((n,i)=>((i/Math.max(1,values.length-1))*86)+","+(27-(n/max)*22)).join(" ");
 return <svg className="metric-sparkline" viewBox="0 0 90 30" aria-hidden="true"><polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points}/></svg>;
}
export function OverviewCharts({data,months,onMonths,onMonth,onCategory,selectedMonth}:{data:Analytics;months:number;onMonths:(months:number)=>void;onMonth:(month:string)=>void;onCategory:(kind:Kind)=>void;selectedMonth:string}){
 const max=Math.max(1,...data.months.map(p=>p.total));
 const ceiling=Math.max(4,Math.ceil(max/4)*4);
 let offset=0;
 const arcs=kinds.map(kind=>{
   const value=data.counts[kind],fraction=data.total?value/data.total:0;
   const item={kind,value,fraction,offset};offset+=fraction*100;return item;
 });
 return <div className="overview-charts">
 <section className="activity-panel" aria-labelledby="activity-heading">
   <header><div><span className="chart-kicker"><BarChart3 size={13}/>PUBLICATION INTELLIGENCE</span><h2 id="activity-heading">Regulatory activity</h2><p>Publications in your {data.scope==="approved"?"approved feed":"stored collection"}</p></div><label className="chart-range"><CalendarDays size={13}/><select aria-label="Chart period" value={months} onChange={e=>onMonths(Number(e.target.value))}><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option></select><ChevronDown size={12}/></label></header>
   <div className="chart-legend">{kinds.map(kind=><span key={kind}><i style={{background:chartColors[kind]}}/>{kind==="warning"?"Letters":kind==="483"?"Form 483s":kind==="recall"?"Recalls":"Approvals"}</span>)}</div>
   <div className="bar-plot">
     <div className="chart-y-axis" aria-hidden="true">{[ceiling,ceiling*.75,ceiling*.5,ceiling*.25,0].map(n=><span key={n}>{n}</span>)}</div>
     <div className="chart-grid" aria-hidden="true">{[0,1,2,3,4].map(n=><i key={n}/>)}</div>
     <div className="month-columns">{data.months.map(point=><button key={point.month} className={"month-column"+(selectedMonth===point.month?" selected-month":"")} onClick={()=>onMonth(point.month)} aria-label={"View "+monthLabel(point.month,true)+" publications: "+point.total+" records"} aria-pressed={selectedMonth===point.month}>
       <span className="bar-tooltip"><strong>{monthLabel(point.month,true)}</strong>{point.total} publications{kinds.filter(k=>point.counts[k]>0).map(k=><span key={k}>{labels[k]}: {point.counts[k]}</span>)}</span>
       <span className="bar-visual"><span className="stacked-bar" style={{height:(point.total/ceiling*100)+"%"}}>{[...kinds].reverse().map(kind=><i key={kind} style={{height:(point.total?point.counts[kind]/point.total*100:0)+"%",background:chartColors[kind]}}/>)}</span></span>
       <span className="month-axis">{monthLabel(point.month)}</span>
     </button>)}</div>
   </div>
   <footer><span>Publication dates · click a month to explore</span><span>{data.total.toLocaleString()} records <ArrowUpRight size={13}/></span></footer>
 </section>
 <section className="mix-panel" aria-labelledby="mix-heading"><header><div><span className="chart-kicker">THE BIGGER PICTURE</span><h2 id="mix-heading">Your signal mix</h2></div><span className="mix-window">{months} months</span></header>
   <div className="mix-content"><div className="donut-wrap"><svg viewBox="0 0 144 144" role="img" aria-label={data.total+" publications by category"}><circle cx="72" cy="72" r="57" fill="none" stroke="#ffffff14" strokeWidth="13"/>{arcs.filter(a=>a.value>0).map(a=><circle key={a.kind} cx="72" cy="72" r="57" pathLength="100" fill="none" stroke={chartColors[a.kind]} strokeWidth="13" strokeDasharray={a.fraction*100+" "+(100-a.fraction*100)} strokeDashoffset={-a.offset} transform="rotate(-90 72 72)"/>)}</svg><div><strong>{data.total.toLocaleString()}</strong><span>publications</span></div></div>
     <div className="mix-legend">{arcs.map(a=><button key={a.kind} onClick={()=>onCategory(a.kind)}><i style={{background:chartColors[a.kind]}}/><span>{a.kind==="warning"?"Warning letters":a.kind==="483"?"Form 483s":a.kind==="recall"?"Drug recalls":"Drug approvals"}</span><strong>{a.value}</strong><small>{data.total?Math.round(a.fraction*100):0}%</small></button>)}</div>
   </div><footer><span><strong>{data.companies}</strong> named companies</span><span>{data.scope==="approved"?"Approved records only":"All stored statuses"}</span></footer>
 </section>
 </div>;
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { initialPreviewRecords,previewList,previewAnalytics,previewDecision } from "../src/lib/preview";
test("public snapshot contains all four categories and approval-scoped charts agree with lists",()=>{
 const rows=initialPreviewRecords();
 assert.equal(rows.length,105);
 assert.equal(previewList(rows,"user",new URLSearchParams()).total,89);
 for(const r of rows){assert.match(r.url,/^https:\/\/([^/]+\.)?fda\.gov\//);assert.ok(["warning","483","recall","approval"].includes(r.kind));}
 const chart=previewAnalytics(rows,"user",6);
 const list=previewList(rows,"user",new URLSearchParams({since:chart.startDate,until:chart.endDate}));
 assert.equal(chart.total,list.total);assert.equal(chart.months.reduce((n,p)=>n+p.total,0),chart.total);
 for(const n of Object.values(chart.counts))assert.ok(n>0);
});
test("sample review is role-scoped, versioned and isolated from the original snapshot",()=>{
 const rows=initialPreviewRecords(),pending=rows.find(r=>r.status==="pending")!;
 const originalVersion=pending.version;
 const body={id:pending.id,version:pending.version,status:"approved",reason:"Manager demonstration"};
 assert.throws(()=>previewDecision(rows,"user",body));
 assert.equal(previewList(rows,"user",new URLSearchParams()).total,89);
 previewDecision(rows,"admin",body);
 assert.equal(previewList(rows,"user",new URLSearchParams()).total,90);
 assert.throws(()=>previewDecision(rows,"admin",body));
 assert.equal(initialPreviewRecords().find(r=>r.id===pending.id)!.version,originalVersion);
 assert.equal(initialPreviewRecords().find(r=>r.id===pending.id)!.status,"pending");
});

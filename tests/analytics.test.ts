import test,{after} from "node:test";
import assert from "node:assert/strict";
import {saveRecord,decide,closeDb,listRecords} from "../src/lib/store";
import {getAnalytics} from "../src/lib/analytics";
import type {Incoming} from "../src/lib/types";
process.env.TRACKER_DB=":memory:";
after(closeDb);
const base:Incoming={externalId:"",kind:"warning",title:"Analytics test fixture",company:"Fixture company",date:"2031-01-05",summary:"Synthetic test only",url:"https://www.fda.gov/test-analytics",source:"Test fixture",reference:false,details:{}};
function record(id:string,date:string,status:"approved"|"pending"|"rejected"){
 const input={...base,externalId:id,url:"https://www.fda.gov/test-analytics/"+id,date};
 const saved=saveRecord(input);
 if(status!=="pending")decide(saved.id,1,status,"Isolated analytics test fixture","test-editor");
 return input;
}
test("chart totals, zero-filled months and category counts respect editorial visibility before aggregation",()=>{
 record("jan","2031-01-05","approved");
 record("feb","2031-02-02","pending");
 record("mar-rejected","2031-03-01","rejected");
 record("mar-approved","2031-03-02","approved");
 record("future","2031-04-01","approved");
 const customer=getAnalytics("user",3,"2031-03-15");
 assert.equal(customer.total,2);
 assert.equal(customer.counts.warning,2);
 assert.deepEqual(customer.months.map(p=>p.total),[1,0,1]);
 assert.equal(customer.months.reduce((n,p)=>n+p.total,0),customer.total);
 assert.equal(customer.scope,"approved");
 const admin=getAnalytics("admin",3,"2031-03-15");
 assert.equal(admin.total,4);
 assert.deepEqual(admin.months.map(p=>p.total),[1,1,2]);
 assert.equal(admin.scope,"stored");
 assert.equal(customer.companies,1);
});
test("changed evidence immediately disappears from customer analytics and bounded chart drilldowns",()=>{
 const input=record("changing","2031-02-10","approved");
 const before=getAnalytics("user",3,"2031-03-15").total;
 saveRecord({...input,summary:"Changed source evidence"});
 assert.equal(getAnalytics("user",3,"2031-03-15").total,before-1);
 const visible=listRecords("user",new URLSearchParams("since=2031-01-01&until=2031-01-31"));
 assert.equal(visible.total,1);
 assert.equal(visible.items[0].date,"2031-01-05");
 assert.throws(()=>listRecords("user",new URLSearchParams("since=2031-03-01&until=2031-01-01")));
});
test("unsupported chart windows and invalid anchor dates fail without inventing chart values",()=>{
 assert.throws(()=>getAnalytics("user",5,"2031-03-15"));
 assert.throws(()=>getAnalytics("user",6,"2031-02-31"));
 const empty=getAnalytics("user",6,"2020-01-01");
 assert.equal(empty.total,0);
 assert.equal(empty.months.length,6);
 assert.ok(empty.months.every(p=>p.total===0));
 assert.equal(empty.latestDate,null);
});

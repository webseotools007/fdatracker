import test,{after} from "node:test";
import assert from "node:assert/strict";
import {db,closeDb,saveRecord,listRecords,decide,validDate,officialUrl} from "../src/lib/store";
import {makeSession,readSession,demoEnabled,sameOrigin} from "../src/lib/auth";
import {parseApprovals,parseRecalls,parse483,parseWarnings,parse483Table} from "../src/lib/collect";
import type {Incoming} from "../src/lib/types";
process.env.TRACKER_DB=":memory:";
process.env.DEMO_LOGIN="true";
process.env.SESSION_SECRET="isolated-test-secret-never-used-in-preview";
after(closeDb);
const input:Incoming={externalId:"test-warning",kind:"warning",title:"Synthetic test only",company:"Example fixture",date:"2026-10-01",summary:"Test fixture; not a regulatory action",url:"https://www.fda.gov/test",source:"Test fixture",reference:true,details:{}};
test("unapproved and rejected records are invisible even when User asks for all statuses",()=>{
 const {id}=saveRecord(input);
 assert.equal(listRecords("user",new URLSearchParams("status=all")).total,0);
 assert.equal(listRecords("admin",new URLSearchParams()).total,1);
 assert.equal(decide(id,1,"rejected","Rejected test fixture","test-admin"),200);
 assert.equal(listRecords("user",new URLSearchParams("status=rejected")).total,0);
});
test("approval persists, stale reviews conflict, updated source version returns to pending and history survives",()=>{
 const item={...input,externalId:"approved-test",url:"https://www.fda.gov/approved-test"};
 const {id}=saveRecord(item);
 assert.equal(decide(id,1,"approved","Reviewed test only","test-admin"),200);
 assert.equal(listRecords("user",new URLSearchParams()).total,1);
 assert.equal(decide(id,1,"rejected","Stale decision","test-admin"),409);
 saveRecord({...item,summary:"Changed source text"});
 assert.equal(listRecords("user",new URLSearchParams()).total,0);
 assert.equal(Number(db().prepare("SELECT count(*) AS n FROM decisions WHERE record_id=?").get(id)!.n),1);
});
test("an unchanged source does not withdraw editorial approval",()=>{
 const item={...input,externalId:"stable",url:"https://www.fda.gov/stable-test"};const {id}=saveRecord(item);
 decide(id,1,"approved","Reviewed test only","test-admin");
 assert.equal(saveRecord(item).changed,false);
 assert.equal(listRecords("user",new URLSearchParams("q=Synthetic")).items.find(x=>x.id===id)?.status,"approved");
});
test("input validation rejects invalid dates, untrusted links, invalid category and pagination",()=>{
 assert.equal(validDate("2026-02-31"),false);assert.equal(officialUrl("https://fda.gov.evil.example/a"),false);
 assert.throws(()=>saveRecord({...input,date:"2026-02-31"}));
 assert.throws(()=>listRecords("admin",new URLSearchParams("kind=unknown")));
 assert.throws(()=>listRecords("admin",new URLSearchParams("page=-1")));
 assert.equal(listRecords("user",new URLSearchParams("q=%27%20OR%201%3D1--")).total,0);
});
test("session signatures cannot be forged, expire, and never enable direct production login",()=>{
 const now=Date.now(),token=makeSession("user",now);
 assert.equal(readSession(token,now),"user");
 assert.equal(readSession(token+"x",now),null);
 assert.equal(readSession(token,now+9*3600000),null);
 assert.equal(demoEnabled({...process.env,NODE_ENV:"production"}),false);
});
test("recall records preserve FDA report date, classification and recall initiation date",()=>{
 const records=parseRecalls({results:[{recall_number:"D-TEST",report_date:"20261001",recall_initiation_date:"20260915",recalling_firm:"Fixture",product_description:"Fixture drug",reason_for_recall:"Fixture only",classification:"Class II",status:"Ongoing"}]});
 assert.equal(records[0].date,"2026-10-01");assert.equal(records[0].details["Recall initiated"],"2026-09-15");
 assert.equal(parseRecalls({results:[{recall_number:"D-MISSING-DATE"}]}).length,0);
});
test("only approved submissions are imported and supplements are never labeled new-drug approvals",()=>{
 const records=parseApprovals({results:[{application_number:"NDA123456",sponsor_name:"Fixture",products:[{brand_name:"Fixture"}],submissions:[{submission_type:"ORIG",submission_number:"1",submission_status:"AP",submission_status_date:"20260102"},{submission_type:"SUPPL",submission_number:"4",submission_status:"AP",submission_status_date:"20260901"},{submission_type:"ORIG",submission_number:"2",submission_status:"CR",submission_status_date:"20261001"}]}]});
 assert.equal(records.length,2);assert.equal(records[1].details["Approval type"],"Supplement approval");
 assert.match(records[1].summary,/not necessarily a new drug/);
});
test("483 RSS excludes unrelated releases and fails visibly on unrecognized data",()=>{
 assert.throws(()=>parse483("<html>Access denied</html>"));
 const result=parse483("<rss><channel><item><title>Fixture 483 issued</title><link>https://www.fda.gov/media/test/download</link><pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate></item><item><title>Establishment Inspection Report</title><link>https://www.fda.gov/media/other/download</link><pubDate>Thu, 01 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>");
 assert.equal(result.length,1);assert.equal(result[0].details["Date shown"],"RSS publication date");
});
test("warning parser keeps drug-office records and does not manufacture data from an empty page",()=>{
 const row="<td>10/13/2026</td><td>10/02/2026</td><td><a href='/warning-letters/test'>Fixture company</a></td><td>Center for Drug Evaluation and Research (CDER)</td><td>Fixture subject</td>";
 assert.equal(parseWarnings("<table><tbody><tr>"+row+"</tr></tbody></table>")[0].date,"2026-10-02");
 assert.throws(()=>parseWarnings("<table><tbody></tbody></table>"));
});
test("same-origin checks use the request Host without trusting unrelated Origins",()=>{
 const request=(origin:string)=>new Request("http://localhost:3037/api/session",{headers:{host:"127.0.0.1:3037",origin}});
 assert.equal(sameOrigin(request("http://127.0.0.1:3037")),true);
 assert.equal(sameOrigin(request("https://evil.example")),false);
});
test("Reading Room HTML fallback imports only specifically identified 483 rows",()=>{
 const record="<td>09/08/2026</td><td>Fixture</td><td>123456</td><td><a href='/media/fixture/download'>483</a></td><td>Texas</td><td>US</td><td>Outsourcing</td><td>09/30/2026</td>";
 const items=parse483Table("<table><tbody><tr>"+record+"</tr></tbody></table>");
 assert.equal(items.length,1);assert.equal(items[0].details["FEI"],"123456");
 assert.throws(()=>parse483Table("<table><tbody><tr>"+record.replace(">483<",">EIR<")+"</tr></tbody></table>"));
});
test("reference and fetched warning records for the same official URL share one identity",()=>{
 const url="https://www.fda.gov/dedup-fixture";
 const first=saveRecord({...input,externalId:"manual-ref",url});
 const next=saveRecord({...input,externalId:"automatic-record",url,reference:false});
 assert.equal(first.id,next.id);
 assert.equal(Number(db().prepare("SELECT count(*) AS n FROM records WHERE url=?").get(url)!.n),1);
});

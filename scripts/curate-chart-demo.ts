// Explicit, local-only chart-demo curation. No synthetic regulatory records are created.
import {db,decide,closeDb} from "../src/lib/store";
import {kinds} from "../src/lib/types";
if(process.env.NODE_ENV==="production")throw new Error("Demo curation is forbidden in production");
const conn=db(),today=new Date().toISOString().slice(0,10);
for(const kind of kinds){
  // Balance by publication month rather than filling the demonstration with one bulk date.
  const monthlyLimit=kind==="approval"?6:kind==="recall"?16:20;
  const candidates=conn.prepare(`SELECT id,version,status,month FROM (
    SELECT id,version,status,date,substr(date,1,7) AS month,
      row_number() OVER(PARTITION BY substr(date,1,7) ORDER BY date DESC,id) AS position
    FROM records WHERE kind=? AND date>=? AND date<=? AND status IN ('pending','approved')
  ) WHERE position<=? ORDER BY date DESC`).all(kind,"2025-11-01",today,monthlyLimit);
  let added=0;
  for(const row of candidates){
    if(row.status!=="pending")continue;
    const status=decide(String(row.id),Number(row.version),"approved",
      "Expanded local chart demonstration: public-source metadata included in a curated sample. Demo publication, not expert regulatory review.","demo-chart-curator");
    if(status===200)added++;
  }
  console.log(kind+": "+added+" additional public records published for the local chart demo");
}
closeDb();

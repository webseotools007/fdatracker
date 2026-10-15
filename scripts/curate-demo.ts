// Explicit manager-demo setup. Never called during application startup or collection.
import { db,decide,closeDb,seedReferences } from "../src/lib/store";
import { kinds } from "../src/lib/types";
if(process.env.NODE_ENV==="production")throw new Error("Demo curation is forbidden in production");
seedReferences();
const conn=db();
// Replace only unreviewed reference duplicates with newly fetched official records.
conn.exec("DELETE FROM records WHERE reference=1 AND NOT EXISTS(SELECT 1 FROM decisions d WHERE d.record_id=records.id) AND EXISTS(SELECT 1 FROM records live WHERE live.url=records.url AND live.kind=records.kind AND live.reference=0)");
for(const kind of kinds){
 const rows=conn.prepare("SELECT id,version FROM records WHERE kind=? AND status='pending' ORDER BY date DESC LIMIT 3").all(kind);
 for(const row of rows)decide(String(row.id),Number(row.version),"approved","Local manager-demo publication only. Source identity and basic metadata checked; not expert regulatory review.","demo-curator");
 console.log(kind+": "+rows.length+" records approved for the manager demo");
}
closeDb();

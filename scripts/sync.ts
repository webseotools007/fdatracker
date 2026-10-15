import { collect } from "../src/lib/collect";
import { seedReferences,closeDb } from "../src/lib/store";
import { kinds } from "../src/lib/types";
async function main(){
 seedReferences();
 try{for(const kind of kinds)console.log(JSON.stringify(await collect(kind)));}
 finally{closeDb();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

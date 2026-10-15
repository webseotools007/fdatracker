import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Incoming, RecordItem, Role } from "./types";
import { kinds } from "./types";
let instance:DatabaseSync|undefined;
export function db() {
 if(instance)return instance;
 const filename=process.env.TRACKER_DB || path.resolve(".data/tracker.sqlite");
 if(filename!==":memory:")mkdirSync(path.dirname(filename),{recursive:true});
 instance=new DatabaseSync(filename);
 instance.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,external_id TEXT UNIQUE NOT NULL,kind TEXT NOT NULL,title TEXT NOT NULL,company TEXT NOT NULL,date TEXT NOT NULL,summary TEXT NOT NULL,url TEXT NOT NULL,source TEXT NOT NULL,reference INTEGER NOT NULL,details TEXT NOT NULL,hash TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'pending',captured_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS decisions(id TEXT PRIMARY KEY,record_id TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL,reason TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,kind TEXT NOT NULL,status TEXT NOT NULL,started_at TEXT NOT NULL,finished_at TEXT,http_status INTEGER,message TEXT,accepted INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS records_kind_date ON records(kind,date);
 `);
 return instance;
}
export function saveRecord(input:Incoming) {
 if(!kinds.includes(input.kind)||!input.title||!input.externalId||!validDate(input.date)||!officialUrl(input.url))throw new Error("Invalid source record");
 const conn=db(), previous=(input.kind==="warning"||input.kind==="483"
   ? conn.prepare("SELECT * FROM records WHERE kind=? AND url=? ORDER BY reference ASC LIMIT 1").get(input.kind,input.url)
   : conn.prepare("SELECT * FROM records WHERE external_id=?").get(input.externalId)) as Record<string,unknown>|undefined;
 const hash=createHash("sha256").update(JSON.stringify(input)).digest("hex");
 if(previous?.hash===hash)return {id:String(previous.id),changed:false};
 const id=previous?String(previous.id):randomUUID();
 conn.prepare(`INSERT INTO records(id,external_id,kind,title,company,date,summary,url,source,reference,details,hash,version,status,captured_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)
 ON CONFLICT(external_id) DO UPDATE SET kind=excluded.kind,title=excluded.title,company=excluded.company,date=excluded.date,summary=excluded.summary,url=excluded.url,source=excluded.source,reference=excluded.reference,details=excluded.details,hash=excluded.hash,version=records.version+1,status='pending',captured_at=excluded.captured_at`)
 .run(id,previous?String(previous.external_id):input.externalId,input.kind,input.title,input.company,input.date,input.summary,input.url,input.source,input.reference?1:0,JSON.stringify(input.details),hash,previous?Number(previous.version)+1:1,new Date().toISOString());
 return {id,changed:true};
}
export function officialUrl(value:string) {try {const u=new URL(value);return u.protocol==="https:"&&(u.hostname==="fda.gov"||u.hostname.endsWith(".fda.gov"));}catch{return false;}}
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function unpack(row:unknown):RecordItem{const x=row as Record<string,unknown>;return {...x,reference:!!x.reference,details:JSON.parse(String(x.details))} as unknown as RecordItem;}
export function listRecords(role:Role,params:URLSearchParams) {
 const where:string[]=[], values:(string|number)[]=[];
 const add=(clause:string,value:string|number)=>{where.push(clause);values.push(value);};
 if(role==="user")where.push("status='approved'");
 else if(params.get("status")&&params.get("status")!=="all"){
   if(!["pending","approved","rejected"].includes(params.get("status")!))throw new Error("Invalid review status");
   add("status=?",params.get("status")!);
 }
 const kind=params.get("kind");if(kind){if(!kinds.includes(kind as typeof kinds[number]))throw new Error("Invalid category");add("kind=?",kind);}
 const q=params.get("q")?.trim()||"";if(q.length>200)throw new Error("Search is too long");
 if(q){const term="%"+q.replace(/[\\%_]/g,"\\$&")+"%";where.push("(title LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\')");values.push(term,term,term);}
 const since=params.get("since");if(since){if(!validDate(since))throw new Error("Invalid date");add("date>=?",since);}
 const until=params.get("until");if(until){if(!validDate(until))throw new Error("Invalid date");add("date<=?",until);}
 if(since&&until&&since>until)throw new Error("Start date must precede end date");
 const page=Number(params.get("page")||1);if(!Number.isInteger(page)||page<1||page>10000)throw new Error("Invalid page");
 const clause=where.length?" WHERE "+where.join(" AND "):"";
 const conn=db(), total=Number(conn.prepare("SELECT count(*) AS n FROM records"+clause).get(...values)!.n);
 const items=conn.prepare("SELECT * FROM records"+clause+" ORDER BY date DESC,id LIMIT 12 OFFSET ?").all(...values,(page-1)*12).map(unpack);
 const countWhere=role==="user"?" WHERE status='approved'":"";
 const counts=Object.fromEntries(kinds.map(k=>[k,0]));
 for(const row of conn.prepare("SELECT kind,count(*) AS n FROM records"+countWhere+" GROUP BY kind").all())counts[String(row.kind)]=Number(row.n);
 return {items,total,page,counts,pending:role==="admin"?Number(conn.prepare("SELECT count(*) AS n FROM records WHERE status='pending'").get()!.n):undefined};
}
export function decide(id:string,version:number,status:string,reason:string,actor:string) {
 if(!["approved","rejected"].includes(status)||!Number.isInteger(version)||reason.trim().length<3||reason.length>1000)throw new Error("A valid decision and rationale are required");
 const conn=db();conn.exec("BEGIN IMMEDIATE");
 try{
 const row=conn.prepare("SELECT version FROM records WHERE id=?").get(id);
 if(!row){conn.exec("ROLLBACK");return 404;}
 if(Number(row.version)!==version){conn.exec("ROLLBACK");return 409;}
 conn.prepare("UPDATE records SET status=?,version=version+1 WHERE id=?").run(status,id);
 conn.prepare("INSERT INTO decisions VALUES(?,?,?,?,?,?,?)").run(randomUUID(),id,version,status,reason.trim(),actor,new Date().toISOString());
 conn.exec("COMMIT");return 200;
 }catch(e){conn.exec("ROLLBACK");throw e;}
}
export function seedReferences() {
 const conn=db();if(conn.prepare("SELECT value FROM settings WHERE key='references-v1'").get())return;
 const records=JSON.parse(readFileSync(path.resolve("data/reference-records.json"),"utf8")) as Incoming[];
 conn.exec("BEGIN IMMEDIATE");
 try{for(const input of records)saveRecord(input);conn.prepare("INSERT INTO settings VALUES('references-v1','loaded')").run();conn.exec("COMMIT");}
 catch(e){conn.exec("ROLLBACK");throw e;}
}
export function closeDb(){instance?.close();instance=undefined;}

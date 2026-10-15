import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Role } from "./types";
export const COOKIE="fda-tracker-demo";
export function demoEnabled(env:NodeJS.ProcessEnv=process.env){
 return env.DEMO_LOGIN==="true" && env.NODE_ENV!=="production";
}
function key(){
 if(process.env.SESSION_SECRET)return process.env.SESSION_SECRET;
 const directory=path.resolve(".data");mkdirSync(directory,{recursive:true});
 const file=path.join(directory,"session-key");
 try {writeFileSync(file,randomBytes(48).toString("hex"),{flag:"wx",mode:0o600});}catch(e){if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;}
 return readFileSync(file,"utf8");
}
const sign=(data:string)=>createHmac("sha256",key()).update(data).digest("base64url");
export function makeSession(role:Role,now=Date.now()){
 if(!demoEnabled())throw new Error("Demo login is disabled");
 const data=Buffer.from(JSON.stringify({role,expires:now+8*3600000})).toString("base64url");
 return data+"."+sign(data);
}
export function readSession(token?:string,now=Date.now()):Role|null{
 if(!demoEnabled()||!token||token.length>1000)return null;
 const [data,signature,...rest]=token.split(".");
 if(!data||!signature||rest.length)return null;
 const a=Buffer.from(signature),b=Buffer.from(sign(data));if(a.length!==b.length||!timingSafeEqual(a,b))return null;
 try{const d=JSON.parse(Buffer.from(data,"base64url").toString());return d.expires>now&&["admin","user"].includes(d.role)?d.role:null;}catch{return null;}
}
export function localHost(host:string){return ["127.0.0.1","localhost","[::1]"].includes(host);}
export function sameOrigin(request:Request){try{const origin=new URL(request.headers.get("origin")||"");return origin.protocol===new URL(request.url).protocol&&origin.host===request.headers.get("host");}catch{return false;}}

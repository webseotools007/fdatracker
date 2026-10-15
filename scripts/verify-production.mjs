import {spawn} from "node:child_process";
import assert from "node:assert/strict";
import {setTimeout as delay} from "node:timers/promises";
const origin="http://127.0.0.1:3039";
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3039"],{windowsHide:true,stdio:"ignore",env:{...process.env,NODE_ENV:"production",DEMO_LOGIN:"true"}});
try{
 let ready=false;
 for(let i=0;i<40;i++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await delay(500);}
 assert.ok(ready,"Production smoke server did not start");
 assert.equal((await fetch(origin+"/api/session",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify({role:"admin"})})).status,403);
 assert.equal((await fetch(origin+"/api/records")).status,401);
 assert.equal((await fetch(origin+"/api/sources")).status,403);
 assert.equal((await fetch(origin+"/dashboard",{redirect:"manual"})).status,307);
 console.log("PASS: production homepage available; direct demo login denied; records/sources denied; dashboard redirects.");
}finally{child.kill();}

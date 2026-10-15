import { spawn } from "node:child_process";
if(process.env.NODE_ENV==="production") throw new Error("Demo launcher is local development only");
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port",process.env.PORT||"3037"],{stdio:"inherit",windowsHide:true,env:{...process.env,DEMO_LOGIN:"true"}});
for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>child.kill(signal));
child.on("exit",code=>{process.exitCode=code||0;});

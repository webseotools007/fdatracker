import { NextRequest } from "next/server";
import { COOKIE,readSession,sameOrigin } from "@/lib/auth";
import { sources,collect } from "@/lib/collect";
import { db } from "@/lib/store";
import { kinds, type Kind } from "@/lib/types";
export const runtime="nodejs";
let active=false;
export async function GET(request:NextRequest){
 if(readSession(request.cookies.get(COOKIE)?.value)!=="admin")return Response.json({error:"Admin access required"},{status:403});
 return Response.json({items:kinds.map(kind=>({...sources[kind],kind,lastRun:db().prepare("SELECT * FROM runs WHERE kind=? ORDER BY started_at DESC LIMIT 1").get(kind)||null})),runs:db().prepare("SELECT * FROM runs ORDER BY started_at DESC LIMIT 12").all()},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest){
 if(readSession(request.cookies.get(COOKIE)?.value)!=="admin")return Response.json({error:"Admin access required"},{status:403});
 if(!sameOrigin(request))return Response.json({error:"Cross-origin collection denied"},{status:403});
 const body=await request.json().catch(()=>null);if(!body||!kinds.includes(body.kind))return Response.json({error:"Choose a valid source"},{status:400});
 if(active)return Response.json({error:"A collection is already running. Please wait."},{status:409});
 active=true;try{return Response.json(await collect(body.kind as Kind));}finally{active=false;}
}

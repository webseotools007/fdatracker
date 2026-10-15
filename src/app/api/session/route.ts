import { NextRequest, NextResponse } from "next/server";
import { COOKIE,demoEnabled,localHost,makeSession,sameOrigin } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 if(!demoEnabled()||!localHost(request.nextUrl.hostname))return NextResponse.json({error:"Direct demo login is only available in local development."},{status:403});
 if(!sameOrigin(request))return NextResponse.json({error:"Cross-origin login denied"},{status:403});
 const body=await request.json().catch(()=>null);
 if(!body||!["admin","user","logout"].includes(body.role))return NextResponse.json({error:"Choose Admin or User"},{status:400});
 const response=NextResponse.json({redirect:body.role==="logout"?"/":"/dashboard"});
 response.cookies.set(COOKIE,body.role==="logout"?"":makeSession(body.role),{httpOnly:true,sameSite:"strict",secure:false,path:"/",maxAge:body.role==="logout"?0:8*3600});
 response.headers.set("Cache-Control","no-store");return response;
}

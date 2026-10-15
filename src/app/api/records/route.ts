import { NextRequest } from "next/server";
import { COOKIE,readSession,sameOrigin } from "@/lib/auth";
import { listRecords,decide,seedReferences } from "@/lib/store";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const role=readSession(request.cookies.get(COOKIE)?.value);
 if(!role)return Response.json({error:"Log in to view publications"},{status:401});
 try{seedReferences();return Response.json(listRecords(role,request.nextUrl.searchParams),{headers:{"Cache-Control":"no-store"}});}
 catch(e){return Response.json({error:e instanceof Error?e.message:"Could not read records"},{status:400});}
}
export async function PATCH(request:NextRequest){
 const role=readSession(request.cookies.get(COOKIE)?.value);
 if(role!=="admin")return Response.json({error:"Admin access required"},{status:403});
 if(!sameOrigin(request))return Response.json({error:"Cross-origin write denied"},{status:403});
 try{const body=await request.json();if(typeof body.id!=="string"||typeof body.reason!=="string")throw new Error("Invalid review");
 const status=decide(body.id,body.version,body.status,body.reason,"local-demo-admin");
 return Response.json(status===200?{saved:true}:{error:status===409?"This record changed. Reload before reviewing.":"Record not found"},{status});}
 catch(e){return Response.json({error:e instanceof Error?e.message:"Review failed"},{status:400});}
}

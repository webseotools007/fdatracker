import { NextRequest } from "next/server";
import { COOKIE,readSession } from "@/lib/auth";
import { seedReferences } from "@/lib/store";
import { getAnalytics } from "@/lib/analytics";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const role=readSession(request.cookies.get(COOKIE)?.value);
 if(!role)return Response.json({error:"Log in to view analytics"},{status:401});
 const months=Number(request.nextUrl.searchParams.get("months")||6);
 if(![3,6,12].includes(months))return Response.json({error:"Choose a 3, 6 or 12 month chart window"},{status:400});
 seedReferences();
 return Response.json(getAnalytics(role,months),{headers:{"Cache-Control":"no-store"}});
}

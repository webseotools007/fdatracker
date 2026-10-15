import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE,readSession } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
export const dynamic="force-dynamic";
export default async function Page(){const role=readSession((await cookies()).get(COOKIE)?.value);if(!role)redirect("/");return <Dashboard role={role}/>;}

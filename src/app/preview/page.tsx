import { Dashboard } from "@/components/dashboard";
export default async function Preview({searchParams}:{searchParams:Promise<{role?:string}>}){
 const {role}=await searchParams;
 return <Dashboard role={role==="admin"?"admin":"user"} preview/>;
}

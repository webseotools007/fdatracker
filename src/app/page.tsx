import { Home } from "@/components/home";
import { demoEnabled } from "@/lib/auth";
export default function Page(){return <Home demo={demoEnabled()}/>;}

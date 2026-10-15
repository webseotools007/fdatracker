import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./overview.css";
export const metadata:Metadata={title:"FDA Tracker — A clearer view of pharma",description:"A focused workspace for FDA Warning Letters, public Form 483s, drug recalls and drug approvals."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

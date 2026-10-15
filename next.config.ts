import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages: ["node:sqlite"], poweredByHeader: false, devIndicators: false, distDir: process.env.NEXT_DIST_DIR || ".next" };
export default config;

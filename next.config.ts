import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "grammy", "node-cron"],
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_TARGET === "pages" ? { output: "export" as const, basePath: process.env.PAGES_BASE_PATH || "/slide-recipes", trailingSlash: true } : {}),
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 适合 Vercel Serverless 及全功能部署，原生支持 /api/proxy 服务端转发
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

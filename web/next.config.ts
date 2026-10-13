import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 适合 Vercel Serverless 及全功能部署，原生支持 /api/proxy 服务端转发
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

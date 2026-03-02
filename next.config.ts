import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" for Docker; omit for Vercel
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

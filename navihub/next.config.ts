import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Reduce polyfills by targeting modern browsers
  transpilePackages: [],
};

export default nextConfig;

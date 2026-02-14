import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/stock_01',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

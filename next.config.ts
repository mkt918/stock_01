import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/stock_01',
  assetPrefix: '/stock_01/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

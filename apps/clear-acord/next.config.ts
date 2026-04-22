import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@clear-acord/acord",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

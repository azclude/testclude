import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/diagnosis",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

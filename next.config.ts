import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  experimental: {
    useCache: true,
  },
}

export default nextConfig

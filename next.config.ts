import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  experimental: {
    useCache: true,
  },
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      // Ignore OpenTelemetry instrumentation warnings from transitive inngest dependencies
      // These are optional observability modules not required for app functionality
      { module: /@opentelemetry\/instrumentation-winston/ },
      { module: /@traceloop\/instrumentation-anthropic/ },
      { module: /require-in-the-middle/ },
    ]
    return config
  },
}

export default nextConfig

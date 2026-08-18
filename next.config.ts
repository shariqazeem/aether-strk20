import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory makes Next infer the wrong workspace
  // root and trace files from there. Pin it to this project.
  outputFileTracingRoot: path.join(__dirname),

  webpack: (config) => {
    // @avnu/avnu-sdk's bundle carries a reference to Node's `fs` on a path the
    // browser never executes. Resolving it to `false` marks it absent instead
    // of failing the client build.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
}

export default nextConfig

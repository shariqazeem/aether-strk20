import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory makes Next infer the wrong workspace
  // root and trace files from there. Pin it to this project.
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },
  output: 'standalone',
  // Disable telemetry in production
  productionBrowserSourceMaps: false
};

export default nextConfig;

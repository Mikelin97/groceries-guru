import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },
  output: 'standalone',
  // Disable telemetry in production
  productionBrowserSourceMaps: false,
  // Skip build-time data fetching
  trailingSlash: false,
  skipTrailingSlashRedirect: true
};

export default nextConfig;

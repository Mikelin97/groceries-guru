import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    clientSegmentCache: true
  },
  output: 'standalone',
  // Disable telemetry in production
  productionBrowserSourceMaps: false,
  // Skip build-time data fetching
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'groceries-guru-attachments.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;

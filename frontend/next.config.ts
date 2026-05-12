import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'backend' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.API_BASE_URL?.replace('/api', '') ?? 'http://backend:4000'}/uploads/:path*`,
      },
    ];
  },
};

export default config;

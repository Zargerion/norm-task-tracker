import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.API_BASE_URL?.replace('/api', '') ?? 'http://localhost:4000'}/uploads/:path*`,
      },
    ];
  },
};

export default config;

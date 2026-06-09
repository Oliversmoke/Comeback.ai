import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['ui-avatars.com', 'lh3.googleusercontent.com', 'storage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

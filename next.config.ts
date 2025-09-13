import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.bwfbadminton.com',
        pathname: '/image/upload/**',
      },
    ],
  },
};

export default nextConfig;

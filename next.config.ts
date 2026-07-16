import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "shopfy-plum\\.vercel\\.app",
          },
        ],
        destination: "https://shopfy.site/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Or "/login", etc. depending on your route prefix
        destination: "https://image-collection-web.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
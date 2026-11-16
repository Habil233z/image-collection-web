import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: "https://image-collection-web.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
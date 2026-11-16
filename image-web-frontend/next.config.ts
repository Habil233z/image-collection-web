import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://image-collection-web.vercel.app/:path*", // Points to your Vercel backend
      },
    ];
  },
};

export default nextConfig;
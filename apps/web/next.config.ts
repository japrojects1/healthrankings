import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337" },
      // Production Strapi host will be added once deployed (e.g. cms.healthrankings.co)
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337" },
      { protocol: "https", hostname: "healthrankings-cms.onrender.com" },
      // Add cms.healthrankings.co here when DNS is attached.
    ],
  },
};

export default nextConfig;

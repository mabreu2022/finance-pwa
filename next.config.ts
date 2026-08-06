import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  ...withPWA({
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
  }),
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/public/database/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Social sources + Supabase Storage. Tightened per-provider in a later phase.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;

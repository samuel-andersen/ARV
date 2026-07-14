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
  // react-pdf uses Node-native modules (fontkit, fs); keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Ensure the vendored print fonts are traced into the PDF route's deployment.
  outputFileTracingIncludes: {
    "/api/books/[id]/pdf": ["./assets/fonts/**"],
  },
};

export default nextConfig;

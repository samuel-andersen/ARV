import { NextResponse } from "next/server";

/**
 * PWA manifest, served dynamically so we can keep the share-target seam in one
 * place. "Share → Arv" from Instagram/TikTok is the primary import gesture on
 * mobile; the target route (/import/share) is wired in the import phase.
 */
export function GET() {
  const manifest = {
    name: "Arv",
    short_name: "Arv",
    description: "From scroll to shelf. A source-to-print system for recipe books.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // Share-target seam: receives shared URLs/text from the OS share sheet.
    share_target: {
      action: "/import/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}

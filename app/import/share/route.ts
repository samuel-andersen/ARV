import { type NextRequest, NextResponse } from "next/server";

/**
 * PWA share-target endpoint. "Share → Arv" from Instagram/TikTok/YouTube lands
 * here (declared in the manifest); we normalize the payload into the import
 * flow's query string and redirect. The (app) layout enforces auth on /import.
 */
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const text = searchParams.get("text") ?? "";

  const shared = url ?? text.match(/https?:\/\/\S+/)?.[0] ?? "";
  const target = new URL("/import", request.url);
  if (shared) target.searchParams.set("url", shared);
  else if (text) target.searchParams.set("text", text);

  return NextResponse.redirect(target);
}

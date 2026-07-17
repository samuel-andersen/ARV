import "server-only";
import { headers } from "next/headers";

/**
 * The origin the request is actually served from, read from the Host header —
 * robust to a missing/misconfigured NEXT_PUBLIC_SITE_URL, so share links and
 * magic-link redirects always use the real domain instead of localhost.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

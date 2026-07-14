import type { SourcePlatform } from "@/lib/schemas/common";

/**
 * MediaFetchProvider — the swappable seam for reaching social media.
 *
 * Instagram/TikTok fetching is expected to be fragile, so this interface is
 * designed for failover and health monitoring from day one. The import agent
 * degrades gracefully across the layers (full video → caption → paste → upload)
 * and never hard-fails; a provider signals what it *couldn't* get rather than
 * throwing.
 */

export interface MediaFetchResult {
  platform: SourcePlatform;
  /** Canonical/cleaned URL if the provider resolved one. */
  canonicalUrl: string | null;
  /** Post caption / description text, if reachable. */
  caption: string | null;
  /** Author handle for attribution (mandatory downstream). */
  author: string | null;
  /** Direct video URL for frame sampling, when the platform allows. */
  videoUrl: string | null;
  /** Poster/thumbnail. */
  thumbnailUrl: string | null;
  /** Which enrichment succeeded — drives the honest UI fallback messaging. */
  reachedVideo: boolean;
  reachedCaption: boolean;
}

export interface MediaFetchProvider {
  readonly id: string;
  /** True if this provider claims to handle the given URL. */
  supports(url: string): boolean;
  fetch(url: string): Promise<MediaFetchResult>;
  /** Lightweight liveness probe for health monitoring / failover ordering. */
  healthCheck(): Promise<boolean>;
}

function platformFromUrl(url: string): SourcePlatform {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return "web";
}

/**
 * Default stub. Returns a typed "nothing reached" result so the pipeline can
 * fall through to the caption/paste/upload paths during the foundation phase.
 * Real adapters (youtube full support; a swappable IG/TikTok fetcher) land in
 * the import phase behind `MEDIA_FETCH_PROVIDER`.
 */
export class StubMediaFetchProvider implements MediaFetchProvider {
  readonly id = "stub";

  supports(): boolean {
    return true;
  }

  async fetch(url: string): Promise<MediaFetchResult> {
    return {
      platform: platformFromUrl(url),
      canonicalUrl: url,
      caption: null,
      author: null,
      videoUrl: null,
      thumbnailUrl: null,
      reachedVideo: false,
      reachedCaption: false,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export function getMediaFetchProvider(): MediaFetchProvider {
  switch (process.env.MEDIA_FETCH_PROVIDER) {
    // case "apify": return new ApifyMediaFetchProvider();  // import phase
    default:
      return new StubMediaFetchProvider();
  }
}

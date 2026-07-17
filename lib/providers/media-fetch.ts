import type { SourcePlatform } from "@/lib/schemas/common";
import { withRetry } from "@/lib/providers/resilience";

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

/* ------------------------------------------------------------------ */
/* Apify implementation — a swappable IG/TikTok scraper behind a token. */
/* ------------------------------------------------------------------ */

/** First non-empty string among candidate keys (supports "a.b" paths). */
function pick(item: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    let v: unknown = item;
    for (const part of key.split(".")) {
      v = v && typeof v === "object" ? (v as Record<string, unknown>)[part] : undefined;
    }
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && typeof v[0] === "string" && v[0]) return v[0];
  }
  return null;
}

export class ApifyMediaFetchProvider implements MediaFetchProvider {
  readonly id = "apify";

  supports(url: string): boolean {
    const p = platformFromUrl(url);
    return p === "instagram" || p === "tiktok";
  }

  async fetch(url: string): Promise<MediaFetchResult> {
    const platform = platformFromUrl(url);
    const token = process.env.APIFY_TOKEN;
    const empty: MediaFetchResult = {
      platform,
      canonicalUrl: url,
      caption: null,
      author: null,
      videoUrl: null,
      thumbnailUrl: null,
      reachedVideo: false,
      reachedCaption: false,
    };
    if (!token) return empty;

    const actor =
      platform === "instagram"
        ? process.env.APIFY_ACTOR_INSTAGRAM ?? "apify~instagram-scraper"
        : process.env.APIFY_ACTOR_TIKTOK ?? "clockworks~tiktok-scraper";
    const input =
      platform === "instagram"
        ? { directUrls: [url], resultsType: "posts", resultsLimit: 1, addParentData: false }
        : { postURLs: [url], resultsPerPage: 1, shouldDownloadVideos: false };

    try {
      const items = await withRetry(
        async (signal) => {
          const res = await fetch(
            `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
            {
              method: "POST",
              signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify(input),
            },
          );
          if (!res.ok) throw new Error(`Apify HTTP ${res.status}`);
          return (await res.json()) as Record<string, unknown>[];
        },
        // Scraping is slow and costs credits — one long attempt, no hammering.
        { attempts: 1, timeoutMs: 90000 },
      );

      const item = Array.isArray(items) ? items[0] : null;
      if (!item) return empty;

      const caption = pick(item, ["caption", "text", "description", "title"]);
      const author = pick(item, [
        "ownerUsername",
        "authorMeta.name",
        "authorMeta.nickName",
        "author",
        "ownerFullName",
      ]);
      const videoUrl = pick(item, [
        "videoUrl",
        "videoMeta.downloadAddr",
        "videoMeta.playAddr",
        "mediaUrl",
        "video.url",
      ]);
      const thumbnailUrl = pick(item, [
        "displayUrl",
        "thumbnailUrl",
        "videoMeta.coverUrl",
        "covers",
        "images",
      ]);

      return {
        platform,
        canonicalUrl: url,
        caption,
        author,
        videoUrl,
        thumbnailUrl,
        reachedVideo: !!videoUrl,
        reachedCaption: !!caption,
      };
    } catch {
      return empty;
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!process.env.APIFY_TOKEN;
  }
}

export function getMediaFetchProvider(): MediaFetchProvider {
  switch (process.env.MEDIA_FETCH_PROVIDER) {
    case "apify":
      return new ApifyMediaFetchProvider();
    default:
      return new StubMediaFetchProvider();
  }
}

import "server-only";
import type { ImportLayer, SourcePlatform } from "@/lib/schemas/common";
import { getMediaFetchProvider } from "@/lib/providers/media-fetch";
import { withRetry } from "@/lib/providers/resilience";

/**
 * SourceAdapter — the "Fetch" + "Read" layers. Each adapter reaches a platform
 * and returns the best text it can assemble for extraction, plus attribution.
 * Failures degrade gracefully (honest fallback message), never hard-fail.
 */

export interface FetchedSource {
  platform: SourcePlatform;
  canonicalUrl: string;
  title: string | null;
  author: string | null;
  /** Assembled text handed to the extraction layer. */
  text: string;
  imageUrls: string[];
  reachedVideo: boolean;
  reachedCaption: boolean;
  layersUsed: ImportLayer[];
  /** Honest, user-facing note about how much we could reach. */
  fallbackMessage: string | null;
}

export function platformFromUrl(url: string): SourcePlatform {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return "web";
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

/** Assemble extraction text from a schema.org/Recipe JSON-LD object. */
function recipeJsonToText(recipe: Record<string, unknown>): {
  title: string | null;
  author: string | null;
  image: string | null;
  text: string;
} | null {
  const type = recipe["@type"];
  const isRecipe = Array.isArray(type)
    ? type.includes("Recipe")
    : type === "Recipe";
  if (!isRecipe) return null;

  const name = typeof recipe.name === "string" ? recipe.name : null;
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? (recipe.recipeIngredient as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const instr = recipe.recipeInstructions;
  const steps: string[] = [];
  if (typeof instr === "string") {
    steps.push(...instr.split(/\.\s+/).filter(Boolean));
  } else if (Array.isArray(instr)) {
    for (const s of instr) {
      if (typeof s === "string") steps.push(s);
      else if (s && typeof s === "object" && "text" in s) {
        const t = (s as { text?: unknown }).text;
        if (typeof t === "string") steps.push(t);
      }
    }
  }

  const author =
    typeof recipe.author === "string"
      ? recipe.author
      : recipe.author && typeof recipe.author === "object" && "name" in recipe.author
        ? String((recipe.author as { name?: unknown }).name ?? "")
        : null;

  const yield_ = recipe.recipeYield;
  const servingsLine = yield_ ? `Serves ${Array.isArray(yield_) ? yield_[0] : yield_}` : "";

  const image =
    typeof recipe.image === "string"
      ? recipe.image
      : Array.isArray(recipe.image) && typeof recipe.image[0] === "string"
        ? (recipe.image[0] as string)
        : null;

  if (!ingredients.length && !steps.length) return null;

  const text = [
    name ?? "",
    servingsLine,
    "Ingredients",
    ...ingredients,
    "Method",
    ...steps,
  ]
    .filter(Boolean)
    .join("\n");

  return { title: name, author: author || null, image, text };
}

function findRecipeJsonLd(html: string): ReturnType<typeof recipeJsonToText> {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      const candidates: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"]
          ? (parsed["@graph"] as Record<string, unknown>[])
          : [parsed];
      for (const c of candidates) {
        const mapped = recipeJsonToText(c);
        if (mapped) return mapped;
      }
    } catch {
      // Malformed JSON-LD — skip this block.
    }
  }
  return null;
}

async function fetchGenericWeb(url: string): Promise<FetchedSource> {
  const platform = platformFromUrl(url);
  try {
    const html = await withRetry(
      async (signal) => {
        const res = await fetch(url, {
          signal,
          headers: { "user-agent": "ArvBot/1.0 (+https://arv.kitchen)" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      },
      { attempts: 3, timeoutMs: 12000 },
    );

    const jsonld = findRecipeJsonLd(html);
    if (jsonld) {
      return {
        platform,
        canonicalUrl: url,
        title: jsonld.title,
        author: jsonld.author,
        text: jsonld.text,
        imageUrls: jsonld.image ? [jsonld.image] : [],
        reachedVideo: false,
        reachedCaption: true,
        layersUsed: ["fetch", "caption"],
        fallbackMessage: null,
      };
    }

    // No structured recipe — fall back to title + description + body text.
    const title =
      metaContent(html, "og:title") ??
      html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
      null;
    const description = metaContent(html, "og:description") ?? metaContent(html, "description");
    const image = metaContent(html, "og:image");
    const body = stripTags(html).slice(0, 6000);

    return {
      platform,
      canonicalUrl: url,
      title,
      author: null,
      text: [title, description, body].filter(Boolean).join("\n"),
      imageUrls: image ? [image] : [],
      reachedVideo: false,
      reachedCaption: true,
      layersUsed: ["fetch", "caption"],
      fallbackMessage:
        "No structured recipe found on the page — extracted from the text. Check quantities.",
    };
  } catch {
    return {
      platform,
      canonicalUrl: url,
      title: null,
      author: null,
      text: "",
      imageUrls: [],
      reachedVideo: false,
      reachedCaption: false,
      layersUsed: ["fetch"],
      fallbackMessage:
        "Couldn't reach that page. Paste the recipe text or upload screenshots instead.",
    };
  }
}

async function fetchYouTube(url: string): Promise<FetchedSource> {
  // Full video analysis (frames + Whisper) is behind the See/Listen seams and
  // not wired yet — for now we reach title/author via oEmbed and degrade
  // honestly if that's all we get.
  try {
    const oembed = await withRetry(
      async (signal) => {
        const res = await fetch(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
          { signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ title?: string; author_name?: string; thumbnail_url?: string }>;
      },
      { attempts: 3, timeoutMs: 10000 },
    );

    return {
      platform: "youtube",
      canonicalUrl: url,
      title: oembed.title ?? null,
      author: oembed.author_name ?? null,
      text: oembed.title ?? "",
      imageUrls: oembed.thumbnail_url ? [oembed.thumbnail_url] : [],
      reachedVideo: false,
      reachedCaption: false,
      layersUsed: ["fetch"],
      fallbackMessage:
        "Reached the video's title but not its audio yet — paste the recipe text or upload screenshots to fill in the details.",
    };
  } catch {
    return {
      platform: "youtube",
      canonicalUrl: url,
      title: null,
      author: null,
      text: "",
      imageUrls: [],
      reachedVideo: false,
      reachedCaption: false,
      layersUsed: ["fetch"],
      fallbackMessage:
        "Couldn't reach the video. Paste the recipe text or upload screenshots instead.",
    };
  }
}

async function fetchSocial(url: string, platform: SourcePlatform): Promise<FetchedSource> {
  // Instagram/TikTok caption via the swappable MediaFetchProvider (stubbed).
  const provider = getMediaFetchProvider();
  const result = await provider.fetch(url);

  const reached = !!result.caption;
  return {
    platform,
    canonicalUrl: result.canonicalUrl ?? url,
    title: null,
    author: result.author,
    text: result.caption ?? "",
    imageUrls: result.thumbnailUrl ? [result.thumbnailUrl] : [],
    reachedVideo: result.reachedVideo,
    reachedCaption: reached,
    layersUsed: reached ? ["fetch", "caption"] : ["fetch"],
    fallbackMessage: reached
      ? "Couldn't reach the video — extracted from the caption. Check quantities."
      : `Couldn't reach that ${platform} post yet (they're fragile). Paste the recipe text or upload screenshots instead.`,
  };
}

/** Fetch a URL through the right adapter. */
export function fetchSource(url: string): Promise<FetchedSource> {
  const platform = platformFromUrl(url);
  switch (platform) {
    case "youtube":
      return fetchYouTube(url);
    case "instagram":
    case "tiktok":
      return fetchSocial(url, platform);
    default:
      return fetchGenericWeb(url);
  }
}

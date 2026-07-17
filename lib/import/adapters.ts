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
        "Fant ingen strukturert oppskrift på siden — hentet ut fra teksten. Sjekk mengdene.",
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
        "Kunne ikke nå siden. Lim inn oppskriftsteksten, eller last opp skjermbilder.",
    };
  }
}

/** Video id from any YouTube URL form (youtu.be, watch?v=, shorts, embed). */
function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** The full video description (where cooking channels put the recipe). */
function extractDescription(html: string): string | null {
  const m = html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
  if (!m) return null;
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return null;
  }
}

/** The spoken transcript, via the first caption track's timedtext feed. */
async function fetchTranscript(html: string): Promise<string | null> {
  const m = html.match(/"captionTracks":\[\{"baseUrl":"(.*?)"/);
  if (!m) return null;
  let baseUrl: string;
  try {
    baseUrl = JSON.parse(`"${m[1]}"`);
  } catch {
    return null;
  }
  try {
    const xml = await withRetry(
      async (signal) => {
        const res = await fetch(baseUrl, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      },
      { attempts: 2, timeoutMs: 10000 },
    );
    const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((t) =>
      decodeEntities(t[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    );
    const text = lines.filter(Boolean).join(" ").slice(0, 14000);
    return text || null;
  } catch {
    return null;
  }
}

async function fetchYouTube(url: string): Promise<FetchedSource> {
  // oEmbed gives a reliable title/author/thumbnail; the watch page gives the
  // description (usually the full recipe) and, when present, the caption
  // transcript. Each layer degrades independently — never hard-fail.
  let title: string | null = null;
  let author: string | null = null;
  let thumbnail: string | null = null;
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
      { attempts: 2, timeoutMs: 10000 },
    );
    title = oembed.title ?? null;
    author = oembed.author_name ?? null;
    thumbnail = oembed.thumbnail_url ?? null;
  } catch {
    /* degrade — the watch page below may still carry the title */
  }

  const id = youtubeVideoId(url);
  let description: string | null = null;
  let transcript: string | null = null;
  if (id) {
    try {
      const html = await withRetry(
        async (signal) => {
          const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
            signal,
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
              "accept-language": "en-US,en;q=0.9",
              cookie: "CONSENT=YES+1",
            },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        },
        { attempts: 2, timeoutMs: 14000 },
      );
      description = extractDescription(html);
      transcript = await fetchTranscript(html);
      if (!title) title = metaContent(html, "og:title");
      if (!thumbnail) thumbnail = metaContent(html, "og:image");
    } catch {
      /* watch page unreachable — fall through to title-only */
    }
  }

  const reachedCaption = !!(description || transcript);
  const text = [
    title ?? "",
    description ? `Beskrivelse:\n${description}` : "",
    transcript ? `Transkripsjon fra videoen:\n${transcript}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    platform: "youtube",
    canonicalUrl: url,
    title,
    author,
    text: text || title || "",
    imageUrls: thumbnail ? [thumbnail] : [],
    reachedVideo: !!transcript,
    reachedCaption,
    layersUsed: reachedCaption ? ["fetch", "caption"] : ["fetch"],
    fallbackMessage: reachedCaption
      ? null
      : "Fant videoens tittel, men ikke oppskriftsteksten. Lim inn oppskriften fra videobeskrivelsen, eller last opp skjermbilder.",
  };
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
      ? "Kunne ikke nå videoen — hentet ut fra bildeteksten. Sjekk mengdene."
      : `Kunne ikke nå dette ${platform}-innlegget ennå (de er skjøre). Lim inn oppskriftsteksten, eller last opp skjermbilder.`,
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

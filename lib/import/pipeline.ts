import "server-only";
import type { ImportLayer, SourcePlatform } from "@/lib/schemas/common";
import { getExtractionProvider } from "@/lib/providers/extraction";
import { getNormalizationProvider } from "@/lib/providers/normalization";
import { getTranscriptionProvider } from "@/lib/providers/transcription";
import { fetchSource, platformFromUrl } from "./adapters";

/**
 * The import agent's layered pipeline (each layer enriches; failures degrade,
 * never hard-fail):
 *   Fetch  → SourceAdapter per platform
 *   See    → frame sampling (seam; not wired)
 *   Listen → transcription (seam; stub)
 *   Read   → caption / description / OCR
 *   Understand → one Claude call → strict JSON
 *   Normalize  → rewrite to house style
 * Returns an editable draft for the Review step.
 */

export interface ImportDraftIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;
  note: string | null;
  needs_review: boolean;
}

export interface ImportDraftStep {
  text: string;
  timer_seconds: number | null;
}

export interface ImportDraft {
  isRecipe: boolean;
  title: string;
  description: string | null;
  servings: number;
  servingsDetected: boolean;
  prep_min: number | null;
  cook_min: number | null;
  image_url: string | null;
  ingredients: ImportDraftIngredient[];
  steps: ImportDraftStep[];
  visualNotes: string[];
  source_platform: SourcePlatform;
  source_url: string | null;
  source_author: string | null;
  layersUsed: ImportLayer[];
  fallbackMessage: string | null;
}

export interface RunImportInput {
  sourceUrl?: string | null;
  rawText?: string | null;
  imageUrls?: string[];
}

export async function runImport(input: RunImportInput): Promise<ImportDraft> {
  let platform: SourcePlatform = "web";
  let author: string | null = null;
  let title: string | null = null;
  let image: string | null = null;
  let text = "";
  let imageUrls = [...(input.imageUrls ?? [])];
  let layersUsed: ImportLayer[] = [];
  let fallbackMessage: string | null = null;

  if (input.sourceUrl) {
    const fetched = await fetchSource(input.sourceUrl);
    platform = fetched.platform;
    author = fetched.author;
    title = fetched.title;
    image = fetched.imageUrls[0] ?? null;
    text = fetched.text;
    imageUrls = [...fetched.imageUrls, ...imageUrls];
    layersUsed = [...fetched.layersUsed];
    fallbackMessage = fetched.fallbackMessage;

    // Listen: when a video/audio URL is reachable (e.g. an IG/TikTok clip) and
    // the transcription provider is configured, add the spoken words to the
    // material. Best-effort — a failure never blocks the import.
    if (fetched.videoUrl) {
      const transcript = await getTranscriptionProvider().transcribe(fetched.videoUrl);
      if (transcript?.text) {
        text = [text, `Transkripsjon fra videoen:\n${transcript.text}`].filter(Boolean).join("\n\n");
        if (!layersUsed.includes("transcript")) layersUsed.push("transcript");
        // We reached the actual spoken recipe — the caption-only caveat lifts.
        if (fallbackMessage) fallbackMessage = null;
      }
    }
  } else {
    // Pure paste-text / screenshot path — no source to reach.
    platform = "web";
  }

  if (input.rawText?.trim()) {
    text = [text, input.rawText.trim()].filter(Boolean).join("\n");
    if (!layersUsed.includes("caption")) layersUsed.push("caption");
  }
  if (imageUrls.length && !layersUsed.includes("ocr")) {
    layersUsed.push("ocr");
  }

  // Understand → Normalize.
  const extraction = await getExtractionProvider().extract({
    text,
    imageUrls,
    authorHint: author,
  });
  const normalized = await getNormalizationProvider().normalize(extraction);

  const servingsDetected = normalized.servings_detected && normalized.servings != null;

  return {
    isRecipe: normalized.is_recipe,
    title: normalized.title?.trim() || title?.trim() || "Oppskrift uten tittel",
    description: normalized.description,
    servings: normalized.servings ?? 4,
    servingsDetected,
    prep_min: normalized.prep_min,
    cook_min: normalized.cook_min,
    image_url: image,
    ingredients: normalized.ingredients,
    steps: normalized.steps,
    visualNotes: normalized.visual_notes,
    source_platform: input.sourceUrl ? platform : "web",
    source_url: input.sourceUrl ?? null,
    source_author: normalized.source_author ?? author,
    layersUsed,
    fallbackMessage,
  };
}

/** Convenience: classify a URL without fetching (for UI hints). */
export function classifyUrl(url: string): SourcePlatform {
  return platformFromUrl(url);
}

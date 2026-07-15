/**
 * Canonical unit set + a deterministic rule-based normalizer. Used by the
 * stub normalization provider (no API key) and as a safe fallback. The
 * Anthropic normalizer does a far better job on prose, but this guarantees the
 * pipeline always produces house-style-ish output offline.
 */
import type { RecipeExtraction } from "@/lib/schemas/recipe";

/** Synonyms → canonical unit. Lowercased, punctuation-stripped keys. */
const UNIT_SYNONYMS: Record<string, string> = {
  // grams
  g: "g", gram: "g", grams: "g", gr: "g",
  kg: "kg", kilo: "kg", kilos: "kg", kilogram: "kg",
  // volume
  ml: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", liter: "l", liters: "l", litre: "l",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", ts: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp", ss: "tbsp", tbs: "tbsp",
  cup: "cup", cups: "cup",
  // count
  clove: "clove", cloves: "clove", fedd: "clove",
  pinch: "pinch", piece: "piece", pieces: "piece",
};

export function canonicalUnit(unit: string | null): string | null {
  if (!unit) return null;
  const key = unit.trim().toLowerCase().replace(/[.\s]/g, "");
  return UNIT_SYNONYMS[key] ?? unit.trim().toLowerCase();
}

function tidyName(name: string): string {
  return name
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // strip emoji
    .replace(/\s+/g, " ")
    .trim();
}

function tidyStep(text: string): string {
  let t = text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // strip emoji
    .replace(/!{2,}/g, ".") // "SO GOOD!!" -> calmer
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return t;
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

/**
 * Rule-based normalization: canonical units, tidy ingredient names, imperative
 * sentence-case steps. Never fabricates quantities. Deterministic.
 */
export function normalizeExtraction(extraction: RecipeExtraction): RecipeExtraction {
  return {
    ...extraction,
    ingredients: extraction.ingredients.map((ing) => ({
      ...ing,
      unit: canonicalUnit(ing.unit),
      name: tidyName(ing.name),
      note: ing.note ? tidyName(ing.note) : null,
    })),
    steps: extraction.steps.map((s) => ({
      ...s,
      text: tidyStep(s.text),
    })),
  };
}

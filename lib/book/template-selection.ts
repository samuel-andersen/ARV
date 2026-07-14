import type { PageTemplate } from "@/lib/schemas/common";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";

/**
 * Auto template selection — the rule that keeps the user from ever making an
 * ugly page. The system picks a page template per recipe from content signals;
 * the user may override, but only within the set of *valid* templates for that
 * content (`validTemplatesFor`). This is deterministic: same content ⇒ same
 * template, which is what makes the book render snapshot-testable.
 */

export interface ImageQuality {
  /** Longest-edge pixels of the source image, if known. */
  longestEdgePx: number | null;
  aspectRatio: number | null;
  /** True if text-overlay contamination was detected (social screenshots). */
  hasTextOverlay: boolean;
}

export interface TemplateSignals {
  hasImage: boolean;
  image: ImageQuality | null;
  ingredientCount: number;
  totalStepChars: number;
}

/**
 * Minimum longest-edge pixels for an image to be trusted as a full-bleed hero
 * at 20×25 cm / 300 DPI. Below this we never blow a photo up — we fall back to
 * a smaller slot or a text-only template so a bad photo can't ruin a page.
 */
const HERO_MIN_LONGEST_EDGE = 2400;
const SLOT_MIN_LONGEST_EDGE = 1200;

export function deriveSignals(recipe: RecipeWithChildren): TemplateSignals {
  const totalStepChars = recipe.steps.reduce((n, s) => n + s.text.length, 0);
  return {
    hasImage: !!recipe.image_url,
    image: recipe.image_url
      ? { longestEdgePx: null, aspectRatio: null, hasTextOverlay: false }
      : null,
    ingredientCount: recipe.ingredients.length,
    totalStepChars,
  };
}

/** Whether an image is clean and large enough to be trusted as a print hero. */
export function imageIsHeroGrade(img: ImageQuality | null): boolean {
  if (!img || img.hasTextOverlay) return false;
  return (img.longestEdgePx ?? 0) >= HERO_MIN_LONGEST_EDGE;
}

/** Whether an image is usable in a smaller (non-hero) photo slot. */
export function imageIsSlotGrade(img: ImageQuality | null): boolean {
  if (!img || img.hasTextOverlay) return false;
  return (img.longestEdgePx ?? 0) >= SLOT_MIN_LONGEST_EDGE;
}

/**
 * The valid templates a user may switch between for a given recipe. Never
 * includes a photo template when the photo can't carry it — that's the image
 * quality defense, encoded.
 */
export function validTemplatesFor(signals: TemplateSignals): PageTemplate[] {
  const options: PageTemplate[] = ["text_only_recipe"];
  if (signals.hasImage && imageIsSlotGrade(signals.image)) {
    options.unshift("photo_and_recipe");
  }
  if (signals.hasImage && imageIsHeroGrade(signals.image)) {
    options.unshift("full_bleed_photo");
  }
  return options;
}

/**
 * The system's default choice. Prefers a hero when the photo can truly carry
 * it, then a photo+recipe spread, and always degrades gracefully to a beautiful
 * text-only page rather than a pixelated hero.
 */
export function selectTemplate(signals: TemplateSignals): PageTemplate {
  // A short, simple recipe reads best as a clean text page even with a photo.
  const isSimple = signals.ingredientCount <= 4 && signals.totalStepChars < 240;

  if (!isSimple && signals.hasImage && imageIsHeroGrade(signals.image)) {
    return "full_bleed_photo";
  }
  if (signals.hasImage && imageIsSlotGrade(signals.image)) {
    return "photo_and_recipe";
  }
  return "text_only_recipe";
}

/** Resolve the effective template, honoring a valid user override only. */
export function resolveTemplate(
  signals: TemplateSignals,
  override: PageTemplate | null,
): PageTemplate {
  if (override && validTemplatesFor(signals).includes(override)) {
    return override;
  }
  return selectTemplate(signals);
}

import { z } from "zod";
import { isoTimestamp, sourcePlatformEnum, uuid } from "./common";

/**
 * Recipe schemas — used for DB rows, forms, and (via `recipeExtractionSchema`)
 * the strict JSON the multimodal Claude call must return.
 */

export const ingredientSchema = z.object({
  id: uuid,
  recipe_id: uuid,
  position: z.number().int().nonnegative(),
  /** Null when unknown — the agent must never invent a quantity. */
  quantity: z.number().nullable(),
  unit: z.string().max(32).nullable(),
  name: z.string().min(1).max(160),
  note: z.string().max(240).nullable(),
  /** Set when the quantity/unit was uncertain or inferred. */
  needs_review: z.boolean().default(false),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const stepSchema = z.object({
  id: uuid,
  recipe_id: uuid,
  position: z.number().int().nonnegative(),
  text: z.string().min(1).max(2000),
  /** Extracted cooking timer in seconds, if the step implies one. */
  timer_seconds: z.number().int().positive().nullable(),
});
export type Step = z.infer<typeof stepSchema>;

export const recipeSchema = z.object({
  id: uuid,
  owner_id: uuid,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  /** The personal note — why this recipe matters. Central to "own" recipes. */
  story: z.string().max(4000).nullable(),
  servings: z.number().int().positive().default(4),
  prep_min: z.number().int().nonnegative().nullable(),
  cook_min: z.number().int().nonnegative().nullable(),
  image_url: z.string().url().nullable(),
  source_platform: sourcePlatformEnum,
  source_url: z.string().url().nullable(),
  source_author: z.string().max(160).nullable(),
  /** True for the user's own recipes (no external attribution). */
  is_original: z.boolean().default(true),
  /** True once the normalization pass has rewritten it to house style. */
  normalized: z.boolean().default(false),
  share_slug: z.string().min(6).max(64).nullable(),
  is_public: z.boolean().default(false),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Recipe = z.infer<typeof recipeSchema>;

/** A recipe with its children — the shape most product surfaces consume. */
export const recipeWithChildrenSchema = recipeSchema.extend({
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
  tags: z.array(z.string()),
});
export type RecipeWithChildren = z.infer<typeof recipeWithChildrenSchema>;

/* ------------------------------------------------------------------ */
/* Form input — what a user submits when creating/editing manually.    */
/* Server assigns ids/positions/timestamps.                            */
/* ------------------------------------------------------------------ */

export const ingredientInputSchema = z.object({
  quantity: z.number().nullable().default(null),
  unit: z.string().max(32).nullable().default(null),
  name: z.string().min(1, "Ingredient name is required").max(160),
  note: z.string().max(240).nullable().default(null),
  needs_review: z.boolean().default(false),
});

export const stepInputSchema = z.object({
  text: z.string().min(1, "Step text is required").max(2000),
  timer_seconds: z.number().int().positive().nullable().default(null),
});

export const recipeInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().default(null),
  story: z.string().max(4000).nullable().default(null),
  servings: z.number().int().positive().default(4),
  prep_min: z.number().int().nonnegative().nullable().default(null),
  cook_min: z.number().int().nonnegative().nullable().default(null),
  image_url: z.string().url().nullable().default(null),
  ingredients: z.array(ingredientInputSchema).min(1, "Add at least one ingredient"),
  steps: z.array(stepInputSchema).min(1, "Add at least one step"),
  tags: z.array(z.string().min(1).max(40)).default([]),
});
export type RecipeInput = z.infer<typeof recipeInputSchema>;

/* ------------------------------------------------------------------ */
/* Extraction — the strict JSON the multimodal Claude call returns.    */
/* Deliberately loose on ids (assigned later) but strict on the rules  */
/* that protect print quality.                                         */
/* ------------------------------------------------------------------ */

export const extractedIngredientSchema = z.object({
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string().min(1),
  note: z.string().nullable(),
  /** The agent flags anything it inferred rather than read directly. */
  needs_review: z.boolean(),
});

export const extractedStepSchema = z.object({
  text: z.string().min(1),
  timer_seconds: z.number().int().positive().nullable(),
});

export const recipeExtractionSchema = z.object({
  is_recipe: z.boolean(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  /** Default 4, but flagged so the UI can surface "we guessed this". */
  servings: z.number().int().positive().nullable(),
  servings_detected: z.boolean(),
  prep_min: z.number().int().nonnegative().nullable(),
  cook_min: z.number().int().nonnegative().nullable(),
  ingredients: z.array(extractedIngredientSchema),
  steps: z.array(extractedStepSchema),
  /** Techniques visible in frames that the audio never mentioned. */
  visual_notes: z.array(z.string()),
  source_author: z.string().nullable(),
});
export type RecipeExtraction = z.infer<typeof recipeExtractionSchema>;

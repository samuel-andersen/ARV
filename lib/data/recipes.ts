import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";

/** A short ingredient preview for the flip-card back. */
export interface IngredientPreview {
  name: string;
  amount: string;
}

/** A recipe list row — enough to render a library card (front + flip back). */
export interface RecipeListItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  source_platform: string;
  source_author: string | null;
  is_original: boolean;
  normalized: boolean;
  servings: number;
  ingredientCount: number;
  tags: string[];
  /** First few ingredients, for the card back. */
  previewIngredients: IngredientPreview[];
  /** First method step, for the card back. */
  firstStep: string | null;
}

type RawIngredient = { name: string; quantity: number | null; unit: string | null; position: number };
type RawStep = { text: string; position: number };

function fmtAmount(q: number | null, unit: string | null): string {
  if (q == null) return unit ?? "";
  const n = Math.round(q * 100) / 100;
  return unit ? `${n} ${unit}` : String(n);
}

/** List the current user's recipes, newest first, with an optional text query. */
export async function listRecipes(query?: string): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, source_platform, source_author, is_original, normalized, servings, ingredients(name, quantity, unit, position), steps(text, position), recipe_tags(tags(name))",
    )
    .order("created_at", { ascending: false });

  if (query && query.trim()) {
    q = q.ilike("title", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r) => {
    const ingredients = [...((r.ingredients ?? []) as unknown as RawIngredient[])].sort(
      (a, b) => a.position - b.position,
    );
    const steps = [...((r.steps ?? []) as unknown as RawStep[])].sort(
      (a, b) => a.position - b.position,
    );
    const tags = ((r.recipe_tags ?? []) as unknown as { tags: { name: string } | null }[])
      .map((rt) => rt.tags?.name)
      .filter((n): n is string => !!n);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      source_platform: r.source_platform,
      source_author: r.source_author,
      is_original: r.is_original,
      normalized: r.normalized,
      servings: r.servings,
      ingredientCount: ingredients.length,
      tags,
      previewIngredients: ingredients.slice(0, 3).map((i) => ({
        name: i.name,
        amount: fmtAmount(i.quantity, i.unit),
      })),
      firstStep: steps[0]?.text ?? null,
    };
  });
}

/** Load a single recipe with its ingredients, steps, and tags. */
export async function getRecipe(id: string): Promise<RecipeWithChildren | null> {
  return loadRecipe("id", id);
}

/**
 * Load a public recipe by its share slug (readable by anyone). Returns null
 * unless the recipe is opted into public sharing — RLS enforces this too.
 */
export async function getPublicRecipeBySlug(
  slug: string,
): Promise<RecipeWithChildren | null> {
  return loadRecipe("share_slug", slug, true);
}

async function loadRecipe(
  column: "id" | "share_slug",
  value: string,
  publicOnly = false,
): Promise<RecipeWithChildren | null> {
  const supabase = await createClient();
  let q = supabase
    .from("recipes")
    .select("*, ingredients(*), steps(*), recipe_tags(tags(name))")
    .eq(column, value);
  if (publicOnly) q = q.eq("is_public", true);

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const ingredients = [...(data.ingredients ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const steps = [...(data.steps ?? [])].sort((a, b) => a.position - b.position);
  const tags = ((data.recipe_tags ?? []) as unknown as { tags: { name: string } | null }[])
    .map((rt) => rt.tags?.name)
    .filter((n): n is string => !!n);

  return {
    ...data,
    ingredients,
    steps,
    tags,
  } as RecipeWithChildren;
}

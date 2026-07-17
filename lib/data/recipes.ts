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
  /** Whether the current user has favorited this recipe. */
  isFavorite: boolean;
  /** How many times the current user has cooked it. */
  cookCount: number;
  /** ISO timestamp of the most recent cook, or null. */
  lastCookedAt: string | null;
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
  // recipe_favorites / recipe_cooks are RLS-scoped to the current user, so the
  // embedded rows come back already filtered to this user.
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, source_platform, source_author, is_original, normalized, servings, ingredients(name, quantity, unit, position), steps(text, position), recipe_tags(tags(name)), recipe_favorites(created_at), recipe_cooks(cooked_at)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Search covers what the field promises — title, ingredients and source/
  // account — not just the title. A leading "@" (an account handle) is ignored.
  const needle = query?.trim().toLowerCase().replace(/^@/, "") ?? "";

  return (data ?? [])
    .filter((r) => {
      if (!needle) return true;
      const ings = ((r.ingredients ?? []) as unknown as RawIngredient[]).map((i) => i.name).join(" ");
      const tags = ((r.recipe_tags ?? []) as unknown as { tags: { name: string } | null }[])
        .map((rt) => rt.tags?.name ?? "")
        .join(" ");
      const hay = [r.title, r.description ?? "", r.source_author ?? "", r.source_platform, ings, tags]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    })
    .map((r) => {
    const ingredients = [...((r.ingredients ?? []) as unknown as RawIngredient[])].sort(
      (a, b) => a.position - b.position,
    );
    const steps = [...((r.steps ?? []) as unknown as RawStep[])].sort(
      (a, b) => a.position - b.position,
    );
    const tags = ((r.recipe_tags ?? []) as unknown as { tags: { name: string } | null }[])
      .map((rt) => rt.tags?.name)
      .filter((n): n is string => !!n);
    const cooks = ((r.recipe_cooks ?? []) as unknown as { cooked_at: string }[]);
    const lastCookedAt = cooks.reduce<string | null>(
      (max, c) => (max === null || c.cooked_at > max ? c.cooked_at : max),
      null,
    );
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
      isFavorite: ((r.recipe_favorites ?? []) as unknown as unknown[]).length > 0,
      cookCount: cooks.length,
      lastCookedAt,
    };
  });
}

/** The current user's favorite + cook state for one recipe (detail page). */
export async function getRecipeEngagement(
  recipeId: string,
): Promise<{ isFavorite: boolean; cookCount: number; lastCookedAt: string | null }> {
  const supabase = await createClient();
  const [{ data: fav }, { data: cooks }] = await Promise.all([
    supabase.from("recipe_favorites").select("recipe_id").eq("recipe_id", recipeId).maybeSingle(),
    supabase
      .from("recipe_cooks")
      .select("cooked_at")
      .eq("recipe_id", recipeId)
      .order("cooked_at", { ascending: false }),
  ]);
  return {
    isFavorite: !!fav,
    cookCount: cooks?.length ?? 0,
    lastCookedAt: cooks?.[0]?.cooked_at ?? null,
  };
}

/** A margin note on a recipe. */
export interface RecipeNote {
  id: string;
  body: string;
  created_at: string;
  authorName: string | null;
}

/** Load a recipe's margin notes, oldest first. */
export async function getRecipeNotes(recipeId: string): Promise<RecipeNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_notes")
    .select("id, body, created_at, profiles(display_name)")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((n) => ({
    id: n.id as string,
    body: n.body as string,
    created_at: n.created_at as string,
    authorName:
      (n.profiles as unknown as { display_name: string | null } | null)?.display_name ?? null,
  }));
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

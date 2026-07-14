import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";

/** A recipe list row — enough to render a library card. */
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
}

/** List the current user's recipes, newest first, with an optional text query. */
export async function listRecipes(query?: string): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, source_platform, source_author, is_original, normalized, servings, ingredients(count)",
    )
    .order("created_at", { ascending: false });

  if (query && query.trim()) {
    q = q.ilike("title", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r) => {
    const ingredients = r.ingredients as unknown as { count: number }[];
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
      ingredientCount: ingredients?.[0]?.count ?? 0,
    };
  });
}

/** Load a single recipe with its ingredients, steps, and tags. */
export async function getRecipe(id: string): Promise<RecipeWithChildren | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "*, ingredients(*), steps(*), recipe_tags(tags(name))",
    )
    .eq("id", id)
    .maybeSingle();

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

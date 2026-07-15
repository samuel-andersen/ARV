"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recipeInputSchema, type RecipeInput } from "@/lib/schemas/recipe";
import { upsertRecipeTags, writeRecipeChildren } from "@/lib/data/recipe-write";

export interface RecipeActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Create a manual recipe (is_original, already in house voice → normalized). */
export async function createRecipe(input: RecipeInput): Promise<RecipeActionResult> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      title: data.title,
      description: data.description,
      story: data.story,
      servings: data.servings,
      prep_min: data.prep_min,
      cook_min: data.cook_min,
      image_url: data.image_url,
      source_platform: "manual",
      is_original: true,
      normalized: true,
    })
    .select("id")
    .single();

  if (error || !recipe) return { error: error?.message ?? "Could not save recipe." };

  await writeRecipeChildren(supabase, recipe.id, data);
  await upsertRecipeTags(supabase, recipe.id, data.tags);

  revalidatePath("/library");
  redirect(`/recipes/${recipe.id}`);
}

/** Replace a recipe's content (children rewritten wholesale for simplicity). */
export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<RecipeActionResult> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update({
      title: data.title,
      description: data.description,
      story: data.story,
      servings: data.servings,
      prep_min: data.prep_min,
      cook_min: data.cook_min,
      image_url: data.image_url,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Rewrite children + tags.
  await supabase.from("ingredients").delete().eq("recipe_id", id);
  await supabase.from("steps").delete().eq("recipe_id", id);
  await supabase.from("recipe_tags").delete().eq("recipe_id", id);
  await writeRecipeChildren(supabase, id, data);
  await upsertRecipeTags(supabase, id, data.tags);

  revalidatePath(`/recipes/${id}`);
  revalidatePath("/library");
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/library");
  redirect("/library");
}

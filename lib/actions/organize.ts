"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Toggle a recipe as one of the current user's favorites. */
export async function toggleFavorite(
  recipeId: string,
  makeFavorite: boolean,
): Promise<{ error?: string; isFavorite?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  if (makeFavorite) {
    const { error } = await supabase
      .from("recipe_favorites")
      .upsert({ user_id: user.id, recipe_id: recipeId });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);
    if (error) return { error: error.message };
  }

  revalidatePath("/library");
  revalidatePath(`/recipes/${recipeId}`);
  return { isFavorite: makeFavorite };
}

/**
 * Record that the current user cooked a recipe (called when cook mode finishes).
 * Best-effort — a failure here should never disrupt the cook flow.
 */
export async function logCook(recipeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { error } = await supabase
    .from("recipe_cooks")
    .insert({ user_id: user.id, recipe_id: recipeId });
  if (error) return { error: error.message };

  revalidatePath("/library");
  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

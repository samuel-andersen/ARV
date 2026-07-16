"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Add a margin note to a recipe (owner only, enforced by RLS). */
export async function addNote(
  recipeId: string,
  body: string,
): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Skriv et notat først." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  const { error } = await supabase
    .from("recipe_notes")
    .insert({ recipe_id: recipeId, author_id: user.id, body: text });
  if (error) return { error: error.message };

  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

/** Delete a note (author only). */
export async function deleteNote(id: string, recipeId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recipe_notes").delete().eq("id", id);
  revalidatePath(`/recipes/${recipeId}`);
}

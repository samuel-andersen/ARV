"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recipeInputSchema, type RecipeInput } from "@/lib/schemas/recipe";
import { upsertRecipeTags, writeRecipeChildren } from "@/lib/data/recipe-write";
import { getRecipe } from "@/lib/data/recipes";

export interface RecipeActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Create a manual recipe (is_original, already in house voice → normalized). */
export async function createRecipe(input: RecipeInput): Promise<RecipeActionResult> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Rett de markerte feltene." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  // Diagnostic guard (ARV-DIAG-v2): getUser() validates the token against the
  // Auth server, but a recipe INSERT is enforced by Postgres RLS
  // (`owner_id = auth.uid()`), which only passes if the *access token* rides
  // along on the PostgREST request. Probe whether the DB sees us at all by
  // reading our own RLS-protected profile row (visible ⟺ auth.uid() == user.id).
  const { data: seenByDb, error: probeError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  const uidTail = user.id.slice(0, 8);
  if (!seenByDb) {
    return {
      error:
        `[ARV-DIAG-v2] Innlogget som …${uidTail}, men databasen ser deg ikke — ` +
        `sesjonen (access-token) når ikke Postgres, så auth.uid() er null. ` +
        (probeError ? `(${probeError.message}) ` : "") +
        `Logg ut og inn igjen; vedvarer det, gi meg beskjed.`,
    };
  }

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

  if (error || !recipe) {
    // The DB *did* see us (profile row visible ⟺ auth.uid() == user.id), yet
    // the insert with owner_id = user.id was still rejected. That points away
    // from the session and at the row itself or a stale policy.
    return {
      error:
        `[ARV-DIAG-v2] Databasen ser deg (…${uidTail}), men insert ble avvist: ` +
        `${error?.message ?? "ukjent"}. owner_id ble satt til …${uidTail}.`,
    };
  }

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
  if (!parsed.success) return { error: "Rett de markerte feltene." };
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

/**
 * Toggle a recipe's public share page (owner opt-in). Generates a stable slug
 * the first time it's shared. Returns the slug when public.
 */
export async function setRecipeSharing(
  id: string,
  makePublic: boolean,
): Promise<{ error?: string; slug?: string | null }> {
  const supabase = await createClient();

  if (!makePublic) {
    const { error } = await supabase.from("recipes").update({ is_public: false }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/recipes/${id}`);
    return { slug: null };
  }

  // Reuse an existing slug if present, else mint one.
  const { data: existing } = await supabase
    .from("recipes")
    .select("share_slug")
    .eq("id", id)
    .maybeSingle();
  const slug =
    existing?.share_slug ?? crypto.randomUUID().replace(/-/g, "").slice(0, 10);

  const { error } = await supabase
    .from("recipes")
    .update({ is_public: true, share_slug: slug })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/recipes/${id}`);
  return { slug };
}

/**
 * "Lag min variant" — duplicate a recipe as the user's own editable copy,
 * keeping source attribution. The original is left untouched.
 */
export async function createVariant(id: string): Promise<RecipeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  const orig = await getRecipe(id);
  if (!orig) return { error: "Fant ikke oppskriften." };

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      title: `${orig.title} — min variant`,
      description: orig.description,
      story: orig.story,
      servings: orig.servings,
      prep_min: orig.prep_min,
      cook_min: orig.cook_min,
      image_url: orig.image_url,
      source_platform: orig.source_platform,
      source_url: orig.source_url,
      source_author: orig.source_author,
      source_raw: (orig as unknown as { source_raw?: string | null }).source_raw ?? null,
      is_original: orig.is_original,
      normalized: true,
    })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Kunne ikke lage variant." };

  await writeRecipeChildren(supabase, created.id, {
    ingredients: orig.ingredients.map((i) => ({
      quantity: i.quantity,
      unit: i.unit,
      name: i.name,
      note: i.note,
      needs_review: i.needs_review,
    })),
    steps: orig.steps.map((s) => ({ text: s.text, timer_seconds: s.timer_seconds })),
  });
  await upsertRecipeTags(supabase, created.id, orig.tags);

  revalidatePath("/library");
  redirect(`/recipes/${created.id}`);
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/library");
  redirect("/library");
}

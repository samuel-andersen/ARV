import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { RecipeInput } from "@/lib/schemas/recipe";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Insert a recipe's ingredients + steps in positional order. */
export async function writeRecipeChildren(
  supabase: Supabase,
  recipeId: string,
  input: Pick<RecipeInput, "ingredients" | "steps">,
) {
  const ingredients = input.ingredients.map((ing, position) => ({
    recipe_id: recipeId,
    position,
    quantity: ing.quantity,
    unit: ing.unit,
    name: ing.name,
    note: ing.note,
    needs_review: ing.needs_review,
  }));
  const steps = input.steps.map((s, position) => ({
    recipe_id: recipeId,
    position,
    text: s.text,
    timer_seconds: s.timer_seconds,
  }));

  const ins = await supabase.from("ingredients").insert(ingredients);
  if (ins.error) throw ins.error;
  const sts = await supabase.from("steps").insert(steps);
  if (sts.error) throw sts.error;
}

/** Upsert tag rows and link them to a recipe (deduped, lowercased). */
export async function upsertRecipeTags(
  supabase: Supabase,
  recipeId: string,
  tagNames: string[],
) {
  const names = [
    ...new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  ];
  if (!names.length) return;

  await supabase
    .from("tags")
    .upsert(names.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
  const { data: tags } = await supabase.from("tags").select("id, name").in("name", names);
  if (tags?.length) {
    await supabase
      .from("recipe_tags")
      .insert(tags.map((t: { id: string }) => ({ recipe_id: recipeId, tag_id: t.id })));
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { runImport, type ImportDraft } from "@/lib/import/pipeline";
import { importRequestSchema } from "@/lib/schemas/import";
import { recipeInputSchema, type RecipeInput } from "@/lib/schemas/recipe";
import { sourcePlatformEnum, type SourcePlatform } from "@/lib/schemas/common";
import { upsertRecipeTags, writeRecipeChildren } from "@/lib/data/recipe-write";
import { z } from "zod";

/** Free plan: 10 imports total; own recipes are unlimited. */
const FREE_IMPORT_LIMIT = 10;

interface StartImportResult {
  jobId?: string;
  draft?: ImportDraft;
  error?: string;
  /** Set when the freemium gate blocked the import. */
  upgradeRequired?: boolean;
}

export async function startImport(input: {
  source_url?: string | null;
  raw_text?: string | null;
  screenshot_paths?: string[];
}): Promise<StartImportResult> {
  const parsed = importRequestSchema.safeParse({
    source_url: input.source_url ?? null,
    raw_text: input.raw_text ?? null,
    screenshot_paths: input.screenshot_paths ?? [],
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid import request." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();

  // Freemium gate.
  if (user.plan === "free") {
    const { count } = await supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("is_original", false);
    if ((count ?? 0) >= FREE_IMPORT_LIMIT) {
      return {
        upgradeRequired: true,
        error: `Free plan includes ${FREE_IMPORT_LIMIT} imports. Upgrade to Pro for unlimited imports.`,
      };
    }
  }

  // Record the job.
  const { data: job } = await supabase
    .from("import_jobs")
    .insert({
      user_id: user.id,
      source_url: parsed.data.source_url,
      status: "analyzing",
    })
    .select("id")
    .single();

  try {
    const draft = await runImport({
      sourceUrl: parsed.data.source_url,
      rawText: parsed.data.raw_text,
      imageUrls: parsed.data.screenshot_paths,
    });

    if (job) {
      await supabase
        .from("import_jobs")
        .update({
          status: draft.isRecipe ? "review" : "failed",
          layers_used: draft.layersUsed,
          raw_caption: draft.fallbackMessage,
          error: draft.isRecipe ? null : "No recipe found in the source.",
        })
        .eq("id", job.id);
    }

    if (!draft.isRecipe) {
      return {
        jobId: job?.id,
        draft,
        error:
          "That didn't look like a recipe. Try pasting the recipe text or uploading screenshots.",
      };
    }

    return { jobId: job?.id, draft };
  } catch (e) {
    if (job) {
      await supabase
        .from("import_jobs")
        .update({ status: "failed", error: (e as Error).message })
        .eq("id", job.id);
    }
    return { error: "The import failed. Paste the recipe text or upload screenshots instead." };
  }
}

const confirmSchema = z.object({
  jobId: z.string().uuid().nullable(),
  recipe: recipeInputSchema,
  source: z.object({
    platform: sourcePlatformEnum,
    url: z.string().url().nullable(),
    author: z.string().nullable(),
  }),
});

export async function confirmImport(input: {
  jobId: string | null;
  recipe: RecipeInput;
  source: { platform: SourcePlatform; url: string | null; author: string | null };
}): Promise<{ error?: string }> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const { jobId, recipe, source } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  // Preserve the original imported text for "Vis originalen".
  let sourceRaw: string | null = null;
  if (jobId) {
    const { data: job } = await supabase
      .from("import_jobs")
      .select("raw_caption, transcript")
      .eq("id", jobId)
      .maybeSingle();
    sourceRaw =
      [job?.raw_caption, job?.transcript].filter(Boolean).join("\n\n").trim() || null;
  }

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      source_raw: sourceRaw,
      title: recipe.title,
      description: recipe.description,
      story: recipe.story,
      servings: recipe.servings,
      prep_min: recipe.prep_min,
      cook_min: recipe.cook_min,
      image_url: recipe.image_url,
      source_platform: source.platform,
      source_url: source.url,
      source_author: source.author,
      is_original: false,
      // The normalization pass already ran during import.
      normalized: true,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Could not save the recipe." };

  await writeRecipeChildren(supabase, created.id, recipe);
  await upsertRecipeTags(supabase, created.id, recipe.tags);

  if (jobId) {
    await supabase
      .from("import_jobs")
      .update({ status: "done", recipe_id: created.id })
      .eq("id", jobId);
  }

  revalidatePath("/library");
  redirect(`/recipes/${created.id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  bookInputSchema,
  chapterInputSchema,
  type BookInput,
} from "@/lib/schemas/book";
import type { PageTemplate } from "@/lib/schemas/common";

export async function createBook(input: BookInput) {
  const parsed = bookInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: book, error } = await supabase
    .from("books")
    .insert({ owner_id: user.id, ...parsed.data })
    .select("id")
    .single();
  if (error || !book) return { error: error?.message ?? "Could not create book." };

  revalidatePath("/books");
  redirect(`/books/${book.id}`);
}

export async function updateBook(id: string, patch: Partial<BookInput> & {
  cover_image?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/books/${id}`);
  return {};
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "book_chapters",
  match: Record<string, string>,
): Promise<number> {
  const { data } = await supabase
    .from(table)
    .select("position")
    .match(match)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addChapter(bookId: string, input: { title: string; intro_text?: string | null }) {
  const parsed = chapterInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Chapter needs a title." };

  const supabase = await createClient();
  const position = await nextPosition(supabase, "book_chapters", { book_id: bookId });
  const { error } = await supabase.from("book_chapters").insert({
    book_id: bookId,
    position,
    title: parsed.data.title,
    intro_text: parsed.data.intro_text,
  });
  if (error) return { error: error.message };
  revalidatePath(`/books/${bookId}`);
  return {};
}

export async function deleteChapter(bookId: string, chapterId: string) {
  const supabase = await createClient();
  await supabase.from("book_chapters").delete().eq("id", chapterId);
  revalidatePath(`/books/${bookId}`);
}

/** Add a recipe to the end of a chapter. */
export async function addRecipeToChapter(
  bookId: string,
  chapterId: string,
  recipeId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("book_recipes")
    .select("position")
    .eq("chapter_id", chapterId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (data?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("book_recipes").insert({
    chapter_id: chapterId,
    recipe_id: recipeId,
    position,
  });
  if (error) return { error: error.message };
  revalidatePath(`/books/${bookId}`);
  return {};
}

export async function removeRecipeFromChapter(
  bookId: string,
  chapterId: string,
  recipeId: string,
) {
  const supabase = await createClient();
  await supabase
    .from("book_recipes")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("recipe_id", recipeId);
  revalidatePath(`/books/${bookId}`);
}

/** Move a placed recipe up or down within its chapter (swap positions). */
export async function moveRecipe(
  bookId: string,
  chapterId: string,
  recipeId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("book_recipes")
    .select("recipe_id, position")
    .eq("chapter_id", chapterId)
    .order("position", { ascending: true });
  if (!rows) return;

  const idx = rows.findIndex((r) => r.recipe_id === recipeId);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapWith];
  // Swap via a temporary negative slot to avoid the unique-ish ordering clash.
  await supabase
    .from("book_recipes")
    .update({ position: -1 })
    .eq("chapter_id", chapterId)
    .eq("recipe_id", a.recipe_id);
  await supabase
    .from("book_recipes")
    .update({ position: a.position })
    .eq("chapter_id", chapterId)
    .eq("recipe_id", b.recipe_id);
  await supabase
    .from("book_recipes")
    .update({ position: b.position })
    .eq("chapter_id", chapterId)
    .eq("recipe_id", a.recipe_id);

  revalidatePath(`/books/${bookId}`);
}

/** Set (or clear) a user's template override for a placed recipe. */
export async function setTemplateOverride(
  bookId: string,
  chapterId: string,
  recipeId: string,
  template: PageTemplate | null,
) {
  const supabase = await createClient();
  await supabase
    .from("book_recipes")
    .update({ template_override: template })
    .eq("chapter_id", chapterId)
    .eq("recipe_id", recipeId);
  revalidatePath(`/books/${bookId}`);
}

export async function deleteBook(id: string) {
  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);
  revalidatePath("/books");
  redirect("/books");
}

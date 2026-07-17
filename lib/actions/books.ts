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
import { getBookWithContent } from "@/lib/data/books";
import { buildBookPages, estimatePageCount } from "@/lib/book/layout";
import { orderTotal } from "@/lib/book/pricing";

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

/* ---- Contributors (sharing v1) ---- */

export async function inviteContributor(bookId: string, email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { error: "Enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("book_contributors").insert({
    book_id: bookId,
    role: "contributor",
    invited_email: clean,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "That person is already invited." : error.message,
    };
  }
  revalidatePath(`/books/${bookId}`);
  return {};
}

/** The invited user accepts — links their account to the contributor row. */
export async function acceptInvite(bookId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { error } = await supabase
    .from("book_contributors")
    .update({ user_id: user.id, accepted_at: new Date().toISOString() })
    .eq("book_id", bookId)
    .eq("invited_email", user.email.toLowerCase());

  // On failure, send them back to the invites list rather than a dead end.
  if (error) redirect("/invites");

  revalidatePath("/invites");
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function removeContributor(bookId: string, email: string) {
  const supabase = await createClient();
  await supabase
    .from("book_contributors")
    .delete()
    .eq("book_id", bookId)
    .eq("invited_email", email);
  revalidatePath(`/books/${bookId}`);
}

export async function deleteBook(id: string) {
  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);
  revalidatePath("/books");
  redirect("/books");
}

export interface OrderDetails {
  copies: number;
  recipientName: string;
  recipientAddress: string;
  giftNote?: string | null;
}

/**
 * Place a print order for a book (fulfillment is stubbed). Recomputes the page
 * count and price server-side (never trusts the client), records the order with
 * recipient + copies + amount, marks the book "ordered", and lands on the
 * confirmation.
 */
export async function orderBook(
  bookId: string,
  details: OrderDetails,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  const name = details.recipientName?.trim();
  const address = details.recipientAddress?.trim();
  if (!name) return { error: "Fyll inn navnet på mottakeren." };
  if (!address || address.length < 8) return { error: "Fyll inn en fullstendig leveringsadresse." };

  // Authoritative price: recompute pages from the book's content. Author
  // name/avatar don't affect the page count, so we pass null.
  const book = await getBookWithContent(bookId);
  if (!book) return { error: "Fant ikke boken." };
  const pages = estimatePageCount(buildBookPages(book, null, null));
  const { copies, total } = orderTotal(pages, details.copies);

  const { error } = await supabase.from("orders").insert({
    book_id: bookId,
    status: "submitted",
    copies,
    amount_cents: total * 100,
    currency: "nok",
    recipient_name: name,
    recipient_address: address,
    gift_note: details.giftNote?.trim() || null,
  });
  if (error) return { error: error.message };

  await supabase.from("books").update({ status: "ordered" }).eq("id", bookId);

  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/print`);
  redirect(`/books/${bookId}/print`);
}

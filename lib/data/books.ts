import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Book, BookChapter } from "@/lib/schemas/book";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";
import type { PageTemplate } from "@/lib/schemas/common";

export interface BookListItem {
  id: string;
  title: string;
  subtitle: string | null;
  style: string;
  status: string;
  recipeCount: number;
}

/** A recipe placed in a book, with its resolved position + any override. */
export interface PlacedRecipe {
  recipe: RecipeWithChildren;
  position: number;
  template_override: PageTemplate | null;
}

export interface ChapterWithRecipes extends BookChapter {
  recipes: PlacedRecipe[];
}

export interface BookWithContent extends Book {
  chapters: ChapterWithRecipes[];
}

export interface Contributor {
  user_id: string | null;
  role: string;
  invited_email: string | null;
  accepted_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

/** List a book's contributors (owner-visible). */
export async function getBookContributors(bookId: string): Promise<Contributor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_contributors")
    .select("user_id, role, invited_email, accepted_at, profiles(display_name, avatar_url)")
    .eq("book_id", bookId);
  if (error) throw error;
  return (data ?? []).map((c) => {
    const p = c.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
    return {
      user_id: c.user_id,
      role: c.role,
      invited_email: c.invited_email,
      accepted_at: c.accepted_at,
      display_name: p?.display_name ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });
}

export interface FamilyMember {
  userId: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  accepted: boolean;
  isOwner: boolean;
}

/**
 * Everyone gathered around a book: the owner first, then contributors
 * (accepted, then still-invited). Visible to any book member — used by the
 * prominent family strip. Names/photos come through the profiles_read_book_
 * members policy.
 */
export async function getBookFamily(
  bookId: string,
  ownerId: string,
): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const [{ data: owner }, contributors] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", ownerId).maybeSingle(),
    getBookContributors(bookId),
  ]);

  const members: FamilyMember[] = [
    {
      userId: ownerId,
      name: (owner as { display_name?: string | null } | null)?.display_name ?? null,
      email: null,
      avatarUrl: (owner as { avatar_url?: string | null } | null)?.avatar_url ?? null,
      accepted: true,
      isOwner: true,
    },
  ];

  const rank = (c: Contributor) => (c.accepted_at ? 0 : 1);
  for (const c of [...contributors].sort((a, b) => rank(a) - rank(b))) {
    members.push({
      userId: c.user_id,
      name: c.display_name,
      email: c.invited_email,
      avatarUrl: c.avatar_url,
      accepted: !!c.accepted_at,
      isOwner: false,
    });
  }
  return members;
}

export interface PendingInvite {
  book_id: string;
  book_title: string;
  invited_email: string | null;
}

/** Invites addressed to the current user's email that they haven't accepted. */
export async function getPendingInvites(email: string): Promise<PendingInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_contributors")
    .select("book_id, invited_email, books(title)")
    .eq("invited_email", email)
    .is("accepted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    book_id: r.book_id,
    invited_email: r.invited_email,
    book_title: (r.books as unknown as { title: string } | null)?.title ?? "a book",
  }));
}

export interface PlacedOrder {
  id: string;
  status: string;
  copies: number;
  amountCents: number | null;
  currency: string;
  recipientName: string | null;
  recipientAddress: string | null;
  giftNote: string | null;
  createdAt: string;
}

/** The most recent order for a book (for the confirmation receipt). */
export async function getLatestOrder(bookId: string): Promise<PlacedOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, copies, amount_cents, currency, recipient_name, recipient_address, gift_note, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    status: data.status,
    copies: data.copies ?? 1,
    amountCents: data.amount_cents ?? null,
    currency: data.currency ?? "nok",
    recipientName: data.recipient_name ?? null,
    recipientAddress: data.recipient_address ?? null,
    giftNote: data.gift_note ?? null,
    createdAt: data.created_at,
  };
}

export async function listBooks(): Promise<BookListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, subtitle, style, status, book_chapters(book_recipes(count))")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((b) => {
    const chapters = (b.book_chapters ?? []) as unknown as {
      book_recipes: { count: number }[];
    }[];
    const recipeCount = chapters.reduce(
      (n, ch) => n + (ch.book_recipes?.[0]?.count ?? 0),
      0,
    );
    return {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      style: b.style,
      status: b.status,
      recipeCount,
    };
  });
}

/**
 * Load a book with chapters and, for each placed recipe, the full recipe with
 * children — everything the builder and PDF renderer need in one call.
 */
export async function getBookWithContent(
  id: string,
): Promise<BookWithContent | null> {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!book) return null;

  const { data: chapters, error: chErr } = await supabase
    .from("book_chapters")
    .select("*, book_recipes(recipe_id, position, template_override)")
    .eq("book_id", id)
    .order("position", { ascending: true });
  if (chErr) throw chErr;

  // Collect all recipe ids, load them with children in one query.
  const placements = (chapters ?? []).flatMap((ch) =>
    ((ch.book_recipes ?? []) as unknown as {
      recipe_id: string;
      position: number;
      template_override: PageTemplate | null;
    }[]).map((br) => ({ chapterId: ch.id, ...br })),
  );
  const recipeIds = [...new Set(placements.map((p) => p.recipe_id))];

  const recipeMap = new Map<string, RecipeWithChildren>();
  if (recipeIds.length) {
    const { data: recipes, error: rErr } = await supabase
      .from("recipes")
      .select("*, ingredients(*), steps(*), recipe_tags(tags(name))")
      .in("id", recipeIds);
    if (rErr) throw rErr;

    for (const r of recipes ?? []) {
      const ingredients = [...(r.ingredients ?? [])].sort(
        (a, b) => a.position - b.position,
      );
      const steps = [...(r.steps ?? [])].sort((a, b) => a.position - b.position);
      const tags = ((r.recipe_tags ?? []) as unknown as {
        tags: { name: string } | null;
      }[])
        .map((rt) => rt.tags?.name)
        .filter((n): n is string => !!n);
      recipeMap.set(r.id, { ...r, ingredients, steps, tags } as RecipeWithChildren);
    }
  }

  const chaptersWithRecipes: ChapterWithRecipes[] = (chapters ?? []).map((ch) => {
    const recipes: PlacedRecipe[] = (
      (ch.book_recipes ?? []) as unknown as {
        recipe_id: string;
        position: number;
        template_override: PageTemplate | null;
      }[]
    )
      .map((br) => {
        const recipe = recipeMap.get(br.recipe_id);
        return recipe
          ? {
              recipe,
              position: br.position,
              template_override: br.template_override,
            }
          : null;
      })
      .filter((x): x is PlacedRecipe => x !== null)
      .sort((a, b) => a.position - b.position);

    return { ...(ch as BookChapter), recipes };
  });

  return { ...(book as Book), chapters: chaptersWithRecipes };
}

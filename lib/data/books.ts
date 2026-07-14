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

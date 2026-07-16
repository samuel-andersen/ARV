import type { BookWithContent } from "@/lib/data/books";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";
import type { PageTemplate } from "@/lib/schemas/common";
import { deriveSignals, resolveTemplate } from "./template-selection";

/**
 * The page model. A book is flattened into an ordered list of page descriptors
 * that BOTH the live preview (HTML) and the PDF renderer consume, so the same
 * content + style always produces the same pages — the property that makes the
 * output snapshot-testable.
 */

export type PageModel =
  | { kind: "cover"; title: string; subtitle: string | null; author: string | null; authorAvatar: string | null; coverImage: string | null }
  | { kind: "dedication"; text: string }
  | { kind: "toc"; entries: { chapter: string; recipes: string[] }[] }
  | { kind: "chapter_opener"; index: number; title: string; introText: string | null }
  | {
      kind: "recipe";
      template: PageTemplate;
      recipe: RecipeWithChildren;
      attribution: { author: string | null; url: string | null; platform: string } | null;
    }
  | { kind: "index"; entries: string[] }
  | { kind: "colophon" };

/** Resolve the effective template for a placed recipe (auto-select + override). */
export function templateForPlacement(
  recipe: RecipeWithChildren,
  override: PageTemplate | null,
): PageTemplate {
  return resolveTemplate(deriveSignals(recipe), override);
}

export function buildBookPages(
  book: BookWithContent,
  authorName: string | null,
  authorAvatar: string | null = null,
): PageModel[] {
  const pages: PageModel[] = [];

  pages.push({
    kind: "cover",
    title: book.title,
    subtitle: book.subtitle,
    author: authorName,
    authorAvatar,
    coverImage: book.cover_image,
  });

  if (book.dedication?.trim()) {
    pages.push({ kind: "dedication", text: book.dedication.trim() });
  }

  pages.push({
    kind: "toc",
    entries: book.chapters.map((ch) => ({
      chapter: ch.title,
      recipes: ch.recipes.map((p) => p.recipe.title),
    })),
  });

  book.chapters.forEach((ch, i) => {
    pages.push({
      kind: "chapter_opener",
      index: i + 1,
      title: ch.title,
      introText: ch.intro_text,
    });
    for (const placed of ch.recipes) {
      const template = templateForPlacement(placed.recipe, placed.template_override);
      pages.push({
        kind: "recipe",
        template,
        recipe: placed.recipe,
        attribution: placed.recipe.is_original
          ? null
          : {
              author: placed.recipe.source_author,
              url: placed.recipe.source_url,
              platform: placed.recipe.source_platform,
            },
      });
    }
  });

  // Auto ingredient index — unique ingredient names across the book, sorted.
  const ingredientNames = new Set<string>();
  for (const ch of book.chapters) {
    for (const placed of ch.recipes) {
      for (const ing of placed.recipe.ingredients) {
        ingredientNames.add(ing.name.trim().toLowerCase());
      }
    }
  }
  if (ingredientNames.size) {
    pages.push({
      kind: "index",
      entries: [...ingredientNames].sort().map((n) => n.replace(/^\w/, (c) => c.toUpperCase())),
    });
  }

  pages.push({ kind: "colophon" });

  return pages;
}

/** Page count estimate for preflight (24–200 spec bounds). */
export function estimatePageCount(pages: PageModel[]): number {
  // Full-bleed photo recipes occupy a spread (2), everything else ~1 page.
  return pages.reduce((n, p) => {
    if (p.kind === "recipe" && p.template === "full_bleed_photo") return n + 2;
    return n + 1;
  }, 0);
}

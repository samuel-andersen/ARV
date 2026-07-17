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

export interface TocEntry {
  chapter: string;
  page: number;
  recipes: { title: string; page: number }[];
}
export interface IndexEntry {
  name: string;
  pages: number[];
}

type PageBody =
  | { kind: "cover"; title: string; subtitle: string | null; author: string | null; authorAvatar: string | null; coverImage: string | null }
  | { kind: "dedication"; text: string }
  | { kind: "toc"; entries: TocEntry[] }
  | { kind: "chapter_opener"; index: number; title: string; introText: string | null }
  | {
      kind: "recipe";
      template: PageTemplate;
      recipe: RecipeWithChildren;
      attribution: { author: string | null; url: string | null; platform: string } | null;
    }
  | { kind: "index"; entries: IndexEntry[] }
  | { kind: "colophon"; author: string | null; contributors: string[] };

/** A page descriptor plus its assigned folio (physical page number, 1-based). */
export type PageModel = PageBody & { folio?: number };

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
  contributorNames: string[] = [],
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

  // The TOC is emitted here but its page numbers are backfilled once every page
  // has a folio (a recipe's page isn't known until the whole book is laid out).
  const tocPage: PageModel & { kind: "toc" } = { kind: "toc", entries: [] };
  pages.push(tocPage);

  const chapterRefs: {
    opener: PageModel & { kind: "chapter_opener" };
    recipes: (PageModel & { kind: "recipe" })[];
  }[] = [];

  book.chapters.forEach((ch, i) => {
    const opener: PageModel & { kind: "chapter_opener" } = {
      kind: "chapter_opener",
      index: i + 1,
      title: ch.title,
      introText: ch.intro_text,
    };
    pages.push(opener);
    const recipeRefs: (PageModel & { kind: "recipe" })[] = [];
    for (const placed of ch.recipes) {
      const template = templateForPlacement(placed.recipe, placed.template_override);
      const rp: PageModel & { kind: "recipe" } = {
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
      };
      pages.push(rp);
      recipeRefs.push(rp);
    }
    chapterRefs.push({ opener, recipes: recipeRefs });
  });

  const hasIngredients = book.chapters.some((ch) =>
    ch.recipes.some((p) => p.recipe.ingredients.length > 0),
  );
  const indexPage: PageModel & { kind: "index" } = { kind: "index", entries: [] };
  if (hasIngredients) pages.push(indexPage);

  pages.push({ kind: "colophon", author: authorName, contributors: contributorNames });

  // Assign folios (physical page numbers), then backfill cross-references.
  pages.forEach((p, i) => {
    p.folio = i + 1;
  });

  tocPage.entries = chapterRefs.map((c) => ({
    chapter: c.opener.title,
    page: c.opener.folio!,
    recipes: c.recipes.map((r) => ({ title: r.recipe.title, page: r.folio! })),
  }));

  if (hasIngredients) {
    const map = new Map<string, Set<number>>();
    for (const c of chapterRefs) {
      for (const r of c.recipes) {
        for (const ing of r.recipe.ingredients) {
          const name = ing.name.trim().toLowerCase();
          if (!name) continue;
          if (!map.has(name)) map.set(name, new Set());
          map.get(name)!.add(r.folio!);
        }
      }
    }
    indexPage.entries = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "nb"))
      .map(([name, set]) => ({
        name: name.replace(/^\w/, (c) => c.toUpperCase()),
        pages: [...set].sort((a, b) => a - b),
      }));
  }

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

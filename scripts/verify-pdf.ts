/**
 * Standalone verification of the PDF pipeline with seed-shaped data — no DB.
 * Exercises fonts + buildBookPages + the Editorial document end-to-end.
 * Run: npx tsx scripts/verify-pdf.ts
 */
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";
import { buildBookPages, estimatePageCount } from "@/lib/book/layout";
import { registerPrintFonts } from "@/lib/pdf/fonts";
import { BookDocument } from "@/lib/pdf/editorial";
import type { BookWithContent } from "@/lib/data/books";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";

function recipe(partial: Partial<RecipeWithChildren> & { title: string }): RecipeWithChildren {
  return {
    id: partial.title,
    owner_id: "u",
    title: partial.title,
    description: partial.description ?? null,
    story: partial.story ?? null,
    servings: partial.servings ?? 4,
    prep_min: partial.prep_min ?? null,
    cook_min: partial.cook_min ?? null,
    image_url: partial.image_url ?? null,
    source_platform: partial.source_platform ?? "manual",
    source_url: partial.source_url ?? null,
    source_author: partial.source_author ?? null,
    is_original: partial.is_original ?? true,
    normalized: true,
    share_slug: null,
    is_public: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ingredients: partial.ingredients ?? [],
    steps: partial.steps ?? [],
    tags: partial.tags ?? [],
  } as RecipeWithChildren;
}

const buns = recipe({
  title: "Grandmother's Cardamom Buns",
  description: "Soft, sweet buns scented with cardamom.",
  story: "Mormor baked these every Sunday.",
  servings: 12,
  ingredients: [
    { id: "1", recipe_id: "r", position: 0, quantity: 500, unit: "g", name: "wheat flour", note: null, needs_review: false },
    { id: "2", recipe_id: "r", position: 1, quantity: 250, unit: "ml", name: "whole milk", note: "lukewarm", needs_review: false },
    { id: "3", recipe_id: "r", position: 2, quantity: 2, unit: "tsp", name: "ground cardamom", note: "freshly ground", needs_review: false },
  ],
  steps: [
    { id: "s1", recipe_id: "r", position: 0, text: "Warm the milk and dissolve the yeast.", timer_seconds: null },
    { id: "s2", recipe_id: "r", position: 1, text: "Mix in flour, butter and cardamom; knead until smooth.", timer_seconds: null },
    { id: "s3", recipe_id: "r", position: 2, text: "Let the dough rise until doubled.", timer_seconds: 3600 },
  ],
  tags: ["baking", "family"],
});

const shrimp = recipe({
  title: "Garlic Butter Shrimp",
  servings: 4,
  is_original: false,
  source_platform: "instagram",
  source_author: "@reels.eats",
  source_url: "https://instagram.com/p/demo5",
  ingredients: [
    { id: "1", recipe_id: "r", position: 0, quantity: 2, unit: "tbsp", name: "butter", note: null, needs_review: false },
    { id: "2", recipe_id: "r", position: 1, quantity: null, unit: null, name: "shrimp", note: "a big handful", needs_review: true },
  ],
  steps: [
    { id: "s1", recipe_id: "r", position: 0, text: "Melt butter, add garlic, cook 30 seconds, then add shrimp until pink.", timer_seconds: null },
  ],
});

const book: BookWithContent = {
  id: "b1",
  owner_id: "u",
  title: "Our Kitchen",
  subtitle: "A first gathering",
  style: "editorial",
  trim_size: "20x25",
  status: "draft",
  cover_image: null,
  dedication: "For everyone who ever cooked at this table.",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  chapters: [
    { id: "c1", book_id: "b1", position: 0, title: "Mornings", intro_text: "How the day begins.", intro_image: null, recipes: [{ recipe: buns, position: 0, template_override: null }] },
    { id: "c2", book_id: "b1", position: 1, title: "Quick", intro_text: null, intro_image: null, recipes: [{ recipe: shrimp, position: 0, template_override: null }] },
  ],
};

async function main() {
  registerPrintFonts();
  const pages = buildBookPages(book, "Demo Cook");

  // Root must be a <Document> element, so call the builder to get the element.
  const element = BookDocument({ pages }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  const out = "scripts/arv-book-verify.pdf";
  writeFileSync(out, buffer);
  console.log(`OK — ${pages.length} page models, est ${estimatePageCount(pages)} book pages`);
  console.log(`PDF: ${buffer.length} bytes, header ${buffer.subarray(0, 5).toString()}`);
  console.log(`Page kinds: ${pages.map((p) => (p.kind === "recipe" ? `recipe:${p.template}` : p.kind)).join(", ")}`);
  console.log(`Wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

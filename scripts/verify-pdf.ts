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

import { join } from "node:path";
const PHOTO = join(process.cwd(), "public", "brand", "ig-post-ink.png");

const buns = recipe({
  title: "Mormors kardemommeboller",
  description: "Myke, søte boller med brunet smør og nykvernet kardemomme.",
  story: "Mormor bakte disse hver søndag.",
  servings: 12,
  prep_min: 40,
  cook_min: 12,
  image_url: PHOTO,
  ingredients: [
    { id: "1", recipe_id: "r", position: 0, quantity: 500, unit: "g", name: "hvetemel", note: null, needs_review: false },
    { id: "2", recipe_id: "r", position: 1, quantity: 2.5, unit: "dl", name: "helmelk", note: "lunken", needs_review: false },
    { id: "3", recipe_id: "r", position: 2, quantity: 2, unit: "ss", name: "malt kardemomme", note: "nykvernet", needs_review: false },
    { id: "4", recipe_id: "r", position: 3, quantity: 1.5, unit: "dl", name: "sukker", note: null, needs_review: false },
    { id: "5", recipe_id: "r", position: 4, quantity: 0.5, unit: "ts", name: "salt", note: null, needs_review: false },
    { id: "6", recipe_id: "r", position: 5, quantity: 0.25, unit: "l", name: "smør", note: "brunet", needs_review: false },
  ],
  steps: [
    { id: "s1", recipe_id: "r", position: 0, text: "Varm melken til fingervarm og løs opp gjæren i den.", timer_seconds: null },
    { id: "s2", recipe_id: "r", position: 1, text: "Elt inn mel, brunet smør og kardemomme til deigen er blank og smidig.", timer_seconds: null },
    { id: "s3", recipe_id: "r", position: 2, text: "La deigen heve til dobbel størrelse, cirka én time et lunt sted.", timer_seconds: 3600 },
    { id: "s4", recipe_id: "r", position: 3, text: "Trill boller, etterhev, og stek på 220°C til de er gyldne.", timer_seconds: 720 },
  ],
  tags: ["baking", "familie"],
});

const suppe = recipe({
  title: "Fiskesuppe fra Bergen",
  description: "En fyldig, kremet suppe med torsk og laks.",
  servings: 4,
  prep_min: 20,
  cook_min: 30,
  is_original: false,
  source_platform: "youtube",
  source_author: "Bestemor",
  source_url: "https://youtube.com/watch?v=demo",
  ingredients: [
    { id: "1", recipe_id: "r", position: 0, quantity: 400, unit: "g", name: "torsk", note: "i biter", needs_review: false },
    { id: "2", recipe_id: "r", position: 1, quantity: 3, unit: "dl", name: "fløte", note: null, needs_review: false },
    { id: "3", recipe_id: "r", position: 2, quantity: 0.5, unit: null, name: "purre", note: "finhakket", needs_review: false },
  ],
  steps: [
    { id: "s1", recipe_id: "r", position: 0, text: "Kok kraft av fiskebeina i tjue minutter, og sil den godt.", timer_seconds: 1200 },
    { id: "s2", recipe_id: "r", position: 1, text: "Tilsett fløte og grønnsaker, la småkoke, og vend inn fisken til slutt.", timer_seconds: null },
  ],
});

const book: BookWithContent = {
  id: "b1",
  owner_id: "u",
  title: "Vårt familiebord",
  subtitle: "Oppskrifter vi gir videre",
  style: "editorial",
  trim_size: "20x25",
  status: "draft",
  cover_image: null,
  dedication: "Til alle som noen gang lagde mat ved dette bordet.",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  chapters: [
    { id: "c1", book_id: "b1", position: 0, title: "Bakst", intro_text: "Det som fyller huset med duft.", intro_image: null, recipes: [{ recipe: buns, position: 0, template_override: null }] },
    { id: "c2", book_id: "b1", position: 1, title: "Til bords", intro_text: null, intro_image: null, recipes: [{ recipe: suppe, position: 0, template_override: null }] },
  ],
};

async function main() {
  registerPrintFonts();
  const pages = buildBookPages(book, "Familien Andersen", null, ["Tove", "Bestemor"]);

  // Root must be a <Document> element, so call the builder to get the element.
  const element = BookDocument({ pages, title: book.title }) as Parameters<typeof renderToBuffer>[0];
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

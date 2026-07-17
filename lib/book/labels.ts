import type { BookStyle, PageTemplate } from "@/lib/schemas/common";
import type { PageModel } from "@/lib/book/layout";

/** Norwegian display names so raw enum values never reach the UI. */

export const STYLE_LABEL: Record<BookStyle, string> = {
  editorial: "Redaksjonell",
  rustic: "Rustikk",
  minimal: "Minimal",
};

export const TEMPLATE_LABEL: Record<PageTemplate, string> = {
  full_bleed_photo: "Helsidebilde",
  photo_and_recipe: "Bilde og oppskrift",
  text_only_recipe: "Bare tekst",
  chapter_opener: "Kapittelåpning",
  dedication: "Dedikasjon",
  toc: "Innhold",
};

export const PAGE_KIND_LABEL: Record<PageModel["kind"], string> = {
  cover: "Omslag",
  dedication: "Dedikasjon",
  toc: "Innhold",
  chapter_opener: "Kapittelåpning",
  recipe: "Oppskrift",
  index: "Register",
  colophon: "Kolofon",
};

/** Caption under a preview thumbnail — the template for recipes, else the kind. */
export function pageCaption(page: PageModel): string {
  return page.kind === "recipe"
    ? TEMPLATE_LABEL[page.template]
    : PAGE_KIND_LABEL[page.kind];
}

/** Join names in Norwegian: "Tove", "Tove og Kari", "Tove, Kari og Per". */
export function joinNames(names: string[]): string {
  const n = names.filter(Boolean);
  if (n.length <= 1) return n[0] ?? "";
  return `${n.slice(0, -1).join(", ")} og ${n[n.length - 1]}`;
}

/**
 * The book's authorship line for the colophon: the owner, plus everyone who
 * contributed — the family dimension made permanent in print.
 */
export function creditLine(author: string | null, contributors: string[]): string {
  const others = joinNames(contributors);
  if (author && others) return `Samlet av ${author}, med ${others}.`;
  if (author) return `Samlet av ${author}.`;
  if (others) return `Samlet av ${others}.`;
  return "";
}

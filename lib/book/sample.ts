import type { PageModel } from "@/lib/book/layout";
import type { RecipeWithChildren } from "@/lib/schemas/recipe";

/**
 * A tiny, real-looking sample used only to show new users the payoff — "slik
 * blir boka di" — before they've added anything. Not persisted; presentation
 * only.
 */

const SAMPLE_RECIPE = {
  id: "sample-1",
  owner_id: "sample",
  title: "Kardemommeboller",
  description: "Myke boller med brunet smør og mye kardemomme.",
  story: null,
  servings: 12,
  prep_min: 40,
  cook_min: 12,
  image_url: null,
  is_public: false,
  share_slug: null,
  is_original: true,
  normalized: true,
  source_platform: "manual",
  source_url: null,
  source_author: null,
  created_at: "",
  updated_at: "",
  ingredients: [
    { id: "s-i1", recipe_id: "sample-1", position: 0, quantity: 500, unit: "g", name: "hvetemel", note: null, needs_review: false },
    { id: "s-i2", recipe_id: "sample-1", position: 1, quantity: 2, unit: "ss", name: "malt kardemomme", note: null, needs_review: false },
    { id: "s-i3", recipe_id: "sample-1", position: 2, quantity: 1.5, unit: "dl", name: "melk", note: null, needs_review: false },
    { id: "s-i4", recipe_id: "sample-1", position: 3, quantity: 150, unit: "g", name: "smør", note: "brunet", needs_review: false },
    { id: "s-i5", recipe_id: "sample-1", position: 4, quantity: 100, unit: "g", name: "sukker", note: null, needs_review: false },
  ],
  steps: [
    { id: "s-s1", recipe_id: "sample-1", position: 0, text: "Brun smøret til det dufter nøtteaktig, og la det kjølne.", timer_seconds: null },
    { id: "s-s2", recipe_id: "sample-1", position: 1, text: "Elt deig med melk, mel, kardemomme og smør. La heve til dobbel størrelse.", timer_seconds: null },
    { id: "s-s3", recipe_id: "sample-1", position: 2, text: "Trill boller, etterhev, og stek på 220°C til gyldne.", timer_seconds: null },
  ],
  tags: ["baking", "familie"],
} as unknown as RecipeWithChildren;

/** An open spread — cover facing the first recipe page. */
export const SAMPLE_SPREAD: PageModel[] = [
  {
    kind: "cover",
    title: "Vårt familiebord",
    subtitle: "Oppskrifter vi gir videre",
    author: "Familien Andersen",
    authorAvatar: null,
    coverImage: null,
  },
  {
    kind: "recipe",
    template: "photo_and_recipe",
    recipe: SAMPLE_RECIPE,
    attribution: null,
  },
];

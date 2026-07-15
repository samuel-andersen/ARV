/**
 * JSON Schema for the extraction/normalization structured output. Mirrors
 * `recipeExtractionSchema` (Zod). We hand-write the JSON Schema — rather than
 * generate it from Zod — because the SDK's zod helper targets a different Zod
 * major than the app uses; the API enforces this schema, and we then validate
 * the result through the Zod schema for a single source of truth on types.
 *
 * Structured-outputs rules: every object sets additionalProperties:false and
 * lists all properties in `required`; nullable fields use ["type","null"].
 */
export const RECIPE_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "is_recipe",
    "title",
    "description",
    "servings",
    "servings_detected",
    "prep_min",
    "cook_min",
    "ingredients",
    "steps",
    "visual_notes",
    "source_author",
  ],
  properties: {
    is_recipe: { type: "boolean" },
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    servings: { type: ["integer", "null"] },
    servings_detected: { type: "boolean" },
    prep_min: { type: ["integer", "null"] },
    cook_min: { type: ["integer", "null"] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quantity", "unit", "name", "note", "needs_review"],
        properties: {
          quantity: { type: ["number", "null"] },
          unit: { type: ["string", "null"] },
          name: { type: "string" },
          note: { type: ["string", "null"] },
          needs_review: { type: "boolean" },
        },
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "timer_seconds"],
        properties: {
          text: { type: "string" },
          timer_seconds: { type: ["integer", "null"] },
        },
      },
    },
    visual_notes: { type: "array", items: { type: "string" } },
    source_author: { type: ["string", "null"] },
  },
} as const;

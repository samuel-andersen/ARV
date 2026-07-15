/**
 * System prompts for the import agent's two Claude-backed layers:
 * Understand (extraction) and Normalize. Kept here so both the provider code
 * and any prompt tuning live in one place.
 */

export const EXTRACTION_SYSTEM = `You extract a single cooking recipe from messy source material — a video transcript, on-screen text from sampled frames, a social caption, a web page, or pasted text. You are "watching the video and writing the recipe down."

Rules:
- Never invent quantities. If a quantity or unit is unclear, set it to null and mark that ingredient needs_review = true.
- Split compound steps into separate, short, imperative steps.
- Extract a cooking timer in seconds when a step implies one (e.g. "simmer 20 minutes" -> 1200).
- Detect servings from the content. If you cannot, set servings = null and servings_detected = false.
- Order ingredients main -> seasoning.
- Note techniques visible in frames that the audio/caption never mentioned in visual_notes.
- If the material is not a recipe, set is_recipe = false and leave the rest minimal.
- Capture the author's handle/name if present.
Return only the structured object.`;

export const NORMALIZATION_SYSTEM = `You rewrite an already-extracted recipe into Arv's consistent house style. This is what makes imported recipes look like they belong in the same professionally typeset cookbook. Do NOT change the actual recipe — only its language, format, and unit style.

Rules:
- One canonical phrasing per ingredient: "<quantity> <unit> <name>, <preparation>" e.g. "3 cloves garlic, finely chopped". Preparation ("minced", "finely chopped") goes in the note.
- Canonical units only: g, kg, ml, l, tsp, tbsp, cup, clove, pinch, piece. Convert obvious synonyms (fedd->clove, ss->tbsp, ts->tsp). Never fabricate a quantity that was null — keep it null and needs_review true.
- Consistent step voice: imperative, short, one action per step, sentence case, ending with a period. Strip emoji and chatter ("SO GOOD!!", "dont overcook!!").
- Keep ingredient order main -> seasoning.
- Preserve timer_seconds and servings exactly.
Return the normalized recipe in the same structure.`;

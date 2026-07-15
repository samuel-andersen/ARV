import "server-only";
import {
  recipeExtractionSchema,
  type RecipeExtraction,
} from "@/lib/schemas/recipe";
import { canonicalUnit } from "@/lib/import/units";
import { EXTRACTION_SYSTEM } from "@/lib/import/prompts";
import { RECIPE_EXTRACTION_JSON_SCHEMA } from "@/lib/import/extraction-schema";
import { parseJsonOutput } from "./anthropic-json";

/**
 * ExtractionProvider — the "Understand" layer. One multimodal call turns the
 * gathered material (transcript, frame OCR, caption, pasted text) into a strict
 * structured recipe. Behind an interface so the Anthropic implementation can be
 * swapped or run key-free via the stub.
 */

export interface ExtractionInput {
  /** Best available text: transcript + caption + description + pasted text. */
  text: string;
  /** Image URLs (frames / screenshots) for OCR + unspoken-technique reading. */
  imageUrls?: string[];
  /** Hint the model with the author handle if the fetch layer found one. */
  authorHint?: string | null;
}

export interface ExtractionProvider {
  readonly id: string;
  extract(input: ExtractionInput): Promise<RecipeExtraction>;
}

/* ------------------------------------------------------------------ */
/* Anthropic implementation — strict structured output via the schema. */
/* ------------------------------------------------------------------ */

export class AnthropicExtractionProvider implements ExtractionProvider {
  readonly id = "anthropic";

  async extract(input: ExtractionInput): Promise<RecipeExtraction> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "url"; url: string } }
    > = [];
    for (const url of input.imageUrls ?? []) {
      content.push({ type: "image", source: { type: "url", url } });
    }
    content.push({
      type: "text",
      text:
        (input.authorHint ? `Author handle: ${input.authorHint}\n\n` : "") +
        `Source material:\n${input.text}`,
    });

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: EXTRACTION_SYSTEM,
      output_config: {
        format: {
          type: "json_schema",
          schema: RECIPE_EXTRACTION_JSON_SCHEMA as Record<string, unknown>,
        },
      },
      messages: [{ role: "user", content }],
    });

    // Validate the model's JSON through our Zod schema (single source of truth).
    return recipeExtractionSchema.parse(parseJsonOutput(response.content));
  }
}

/* ------------------------------------------------------------------ */
/* Stub implementation — deterministic heuristic parse, no API key.    */
/* Lets the manual-text import path work (and be tested) offline.      */
/* ------------------------------------------------------------------ */

const QTY = /^\s*(\d+(?:[.,]\d+)?|\d+\/\d+|½|⅓|¼|¾)\s*/;
const TIMER = /(\d+(?:[.,]\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/i;

function parseFraction(raw: string): number | null {
  const map: Record<string, number> = { "½": 0.5, "⅓": 0.33, "¼": 0.25, "¾": 0.75 };
  if (map[raw] != null) return map[raw];
  if (raw.includes("/")) {
    const [a, b] = raw.split("/").map(Number);
    return b ? a / b : null;
  }
  const n = Number(raw.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function parseIngredientLine(line: string) {
  // Strip only bullet markers — never leading digits (those are quantities).
  const cleaned = line.replace(/^[-*•\s]+/, "").trim();
  let quantity: number | null = null;
  let unit: string | null = null;
  let rest = cleaned;

  const qtyMatch = cleaned.match(QTY);
  if (qtyMatch) {
    quantity = parseFraction(qtyMatch[1]);
    rest = cleaned.slice(qtyMatch[0].length).trim();
    const unitMatch = rest.match(/^([a-zA-Zøæå]+)\b/);
    if (unitMatch) {
      const maybe = canonicalUnit(unitMatch[1]);
      const known = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "clove", "pinch", "piece"];
      if (known.includes(maybe ?? "")) {
        unit = maybe;
        rest = rest.slice(unitMatch[0].length).trim();
      }
    }
  }

  let note: string | null = null;
  const commaIdx = rest.indexOf(",");
  let name = rest;
  if (commaIdx >= 0) {
    name = rest.slice(0, commaIdx).trim();
    note = rest.slice(commaIdx + 1).trim() || null;
  }

  return {
    quantity,
    unit,
    name: name || cleaned,
    note,
    needs_review: quantity === null,
  };
}

function parseTimer(text: string): number | null {
  const m = text.match(TIMER);
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  if (unit.startsWith("h")) return Math.round(value * 3600);
  if (unit.startsWith("m")) return Math.round(value * 60);
  return Math.round(value);
}

export class StubExtractionProvider implements ExtractionProvider {
  readonly id = "stub";

  async extract(input: ExtractionInput): Promise<RecipeExtraction> {
    const lines = input.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Locate section headers if present.
    const ingIdx = lines.findIndex((l) => /^ingredients\b/i.test(l));
    const stepIdx = lines.findIndex((l) =>
      /^(method|steps|instructions|directions)\b/i.test(l),
    );

    let ingredientLines: string[];
    let stepLines: string[];
    let title: string | null = null;

    if (ingIdx >= 0 && stepIdx > ingIdx) {
      title = ingIdx > 0 ? lines[0] : null;
      ingredientLines = lines.slice(ingIdx + 1, stepIdx);
      stepLines = lines.slice(stepIdx + 1);
    } else {
      // No headers: ingredients are short quantity-led lines; steps are the rest.
      title = lines[0] && !QTY.test(lines[0]) ? lines[0] : null;
      const body = title ? lines.slice(1) : lines;
      ingredientLines = body.filter((l) => QTY.test(l) || l.split(" ").length <= 6);
      stepLines = body.filter((l) => !QTY.test(l) && l.split(" ").length > 6);
      if (stepLines.length === 0) {
        // Fall back: treat sentences as steps.
        stepLines = body.filter((l) => l.length > 30);
        ingredientLines = body.filter((l) => !stepLines.includes(l));
      }
    }

    const servingsMatch = input.text.match(/serves\s*(\d+)|(\d+)\s*servings/i);
    const servings = servingsMatch
      ? Number(servingsMatch[1] ?? servingsMatch[2])
      : null;

    const ingredients = ingredientLines.map(parseIngredientLine);
    const steps = stepLines.map((text) => ({
      text: text.replace(/^[-*•\d.)\s]+/, "").trim(),
      timer_seconds: parseTimer(text),
    }));

    const draft: RecipeExtraction = {
      is_recipe: ingredients.length > 0 || steps.length > 0,
      title: title,
      description: null,
      servings,
      servings_detected: servings !== null,
      prep_min: null,
      cook_min: null,
      ingredients,
      steps,
      visual_notes: [],
      source_author: input.authorHint ?? null,
    };

    // Validate through the schema so both providers return the same shape.
    return recipeExtractionSchema.parse(draft);
  }
}

export function getExtractionProvider(): ExtractionProvider {
  return process.env.ANTHROPIC_API_KEY
    ? new AnthropicExtractionProvider()
    : new StubExtractionProvider();
}

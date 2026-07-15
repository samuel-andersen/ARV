import "server-only";
import {
  recipeExtractionSchema,
  type RecipeExtraction,
} from "@/lib/schemas/recipe";
import { normalizeExtraction } from "@/lib/import/units";
import { NORMALIZATION_SYSTEM } from "@/lib/import/prompts";
import { RECIPE_EXTRACTION_JSON_SCHEMA } from "@/lib/import/extraction-schema";
import { parseJsonOutput } from "./anthropic-json";

/**
 * NormalizationProvider — layer 6, the secret sauce for print quality. Rewrites
 * an extracted recipe into Arv's consistent house language, format, and unit
 * style so imported recipes look typeset alongside everything else.
 */

export interface NormalizationProvider {
  readonly id: string;
  normalize(extraction: RecipeExtraction): Promise<RecipeExtraction>;
}

export class AnthropicNormalizationProvider implements NormalizationProvider {
  readonly id = "anthropic";

  async normalize(extraction: RecipeExtraction): Promise<RecipeExtraction> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    try {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: NORMALIZATION_SYSTEM,
        output_config: {
          format: {
            type: "json_schema",
            schema: RECIPE_EXTRACTION_JSON_SCHEMA as Record<string, unknown>,
          },
        },
        messages: [
          {
            role: "user",
            content: `Normalize this recipe to house style:\n${JSON.stringify(extraction, null, 2)}`,
          },
        ],
      });
      return recipeExtractionSchema.parse(parseJsonOutput(response.content));
    } catch {
      // Never hard-fail: fall back to the deterministic rule-based pass.
      return normalizeExtraction(extraction);
    }
  }
}

/** Deterministic rule-based normalization — used with no API key. */
export class StubNormalizationProvider implements NormalizationProvider {
  readonly id = "stub";

  async normalize(extraction: RecipeExtraction): Promise<RecipeExtraction> {
    return normalizeExtraction(extraction);
  }
}

export function getNormalizationProvider(): NormalizationProvider {
  return process.env.ANTHROPIC_API_KEY
    ? new AnthropicNormalizationProvider()
    : new StubNormalizationProvider();
}

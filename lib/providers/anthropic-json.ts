import "server-only";

type ContentBlock = { type: string; text?: string };

/**
 * Pull the structured JSON out of a Messages response. With adaptive thinking,
 * the response may contain thinking blocks before the text block that carries
 * the JSON — find the text block and parse it.
 */
export function parseJsonOutput(content: ContentBlock[]): unknown {
  const textBlock = content.find((b) => b.type === "text" && typeof b.text === "string");
  if (!textBlock?.text) {
    throw new Error("Model returned no text output to parse");
  }
  return JSON.parse(textBlock.text);
}

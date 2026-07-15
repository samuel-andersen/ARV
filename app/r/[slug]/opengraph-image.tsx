import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPublicRecipeBySlug } from "@/lib/data/recipes";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A recipe shared via Arv";

// Arv tokens.
const SALVIE = "#E3EAE4";
const GRAN = "#49604F";
const INK = "#141413";
const STONE = "#6F6F6C";

function loadFont(file: string): Buffer | null {
  try {
    return readFileSync(join(process.cwd(), "assets", "fonts", file));
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);

  const title = recipe?.title ?? "A recipe on Arv";
  const via =
    recipe && !recipe.is_original && recipe.source_author
      ? `via ${recipe.source_author}`
      : null;

  const fraunces = loadFont("fraunces-400.woff");
  const inter = loadFont("inter-500.woff");
  const fonts = [
    fraunces && { name: "Fraunces", data: fraunces, weight: 400 as const, style: "normal" as const },
    inter && { name: "Inter", data: inter, weight: 500 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: Buffer; weight: 400 | 500; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: SALVIE,
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            fontFamily: "Inter",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: GRAN,
          }}
        >
          Arv
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 76,
              lineHeight: 1.05,
              color: INK,
              maxWidth: 960,
            }}
          >
            {title}
          </div>
          {via && (
            <div style={{ fontFamily: "Inter", fontSize: 26, color: GRAN, marginTop: 18 }}>
              {via}
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: STONE,
          }}
        >
          From scroll to shelf · arv.kitchen
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

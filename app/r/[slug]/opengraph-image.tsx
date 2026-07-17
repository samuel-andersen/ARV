import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPublicRecipeBySlug } from "@/lib/data/recipes";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "En oppskrift delt via Arv";

// Arv tokens.
const SALVIE = "#E3EAE4";
const GRAN = "#49604F";
const INK = "#141413";
const STONE = "#6F6F6C";
const SNOW = "#FFFFFF";

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

  const title = recipe?.title ?? "En oppskrift på Arv";
  const via =
    recipe && !recipe.is_original && recipe.source_author
      ? `etter ${recipe.source_author}`
      : null;
  const image = recipe?.image_url ?? null;

  const fraunces = loadFont("fraunces-400.woff");
  const inter = loadFont("inter-500.woff");
  const fonts = [
    fraunces && { name: "Fraunces", data: fraunces, weight: 400 as const, style: "normal" as const },
    inter && { name: "Inter", data: inter, weight: 500 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: Buffer; weight: 400 | 500; style: "normal" }[];

  // With a photo: full-bleed image + gradient scrim, text over the bottom — the
  // food is the hero and the title has full width to wrap.
  if (image) {
    return new ImageResponse(
      (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            width={1200}
            height={630}
            alt=""
            style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(20,20,19,0.15) 0%, rgba(20,20,19,0) 35%, rgba(20,20,19,0.82) 100%)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "60px 72px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter",
                fontSize: 22,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: SNOW,
              }}
            >
              Arv
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: "Fraunces",
                  fontSize: 72,
                  lineHeight: 1.03,
                  color: SNOW,
                  maxWidth: 1040,
                }}
              >
                {title}
              </div>
              {via && (
                <div style={{ fontFamily: "Inter", fontSize: 26, color: "rgba(255,255,255,0.85)", marginTop: 16 }}>
                  {via}
                </div>
              )}
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: 18,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 22,
                }}
              >
                Fra feed til familiearv · arv.kitchen
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size, fonts: fonts.length ? fonts : undefined },
    );
  }

  // No photo: the quiet Salvie type card.
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
        <div style={{ fontFamily: "Inter", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: GRAN }}>
          Arv
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 76, lineHeight: 1.05, color: INK, maxWidth: 960 }}>
            {title}
          </div>
          {via && (
            <div style={{ fontFamily: "Inter", fontSize: 26, color: GRAN, marginTop: 18 }}>{via}</div>
          )}
        </div>
        <div style={{ fontFamily: "Inter", fontSize: 20, letterSpacing: 4, textTransform: "uppercase", color: STONE }}>
          Fra feed til familiearv · arv.kitchen
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}

import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PageModel } from "@/lib/book/layout";
import { color } from "@/lib/design/tokens";

// 20×25 cm in PDF points (1 cm = 28.3465 pt).
const CM = 28.3465;
const PAGE = { width: 20 * CM, height: 25 * CM };

const s = StyleSheet.create({
  page: {
    backgroundColor: color.snow,
    color: color.ink,
    fontFamily: "Fraunces",
    fontWeight: 400,
    paddingVertical: 54,
    paddingHorizontal: 48,
  },
  eyebrow: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: color.stone,
  },
  eyebrowGran: { color: color.gran },
  // Cover
  cover: {
    backgroundColor: color.salvie,
    paddingVertical: 90,
    paddingHorizontal: 60,
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  coverTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 40, lineHeight: 1.05 },
  coverSub: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 15, color: color.gran, marginTop: 10 },
  coverAuthor: { fontFamily: "Inter", fontWeight: 400, fontSize: 10, color: color.stone },
  // Dedication
  center: { flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" },
  dedication: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 16, lineHeight: 1.6, textAlign: "center", maxWidth: "80%", color: color.ink },
  // Chapter opener
  chapterCenter: { flexDirection: "column", justifyContent: "center", height: "100%" },
  chapterTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 34, marginTop: 8 },
  chapterIntro: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 12, lineHeight: 1.6, color: color.stone, marginTop: 12, maxWidth: "78%" },
  // Recipe
  recipeTitle: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 26, lineHeight: 1.1 },
  recipeDesc: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 11, color: color.stone, marginTop: 4 },
  meta: { fontFamily: "Inter", fontWeight: 400, fontSize: 8, color: color.stone, marginTop: 8, letterSpacing: 0.5 },
  columns: { flexDirection: "row", marginTop: 24, gap: 24 },
  colIngredients: { width: "36%" },
  colSteps: { flex: 1 },
  ing: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 9.5, lineHeight: 1.5, marginBottom: 4, color: color.ink },
  step: { flexDirection: "row", marginBottom: 8 },
  stepNum: { fontFamily: "Inter", fontWeight: 500, fontSize: 8, color: color.stone, width: 16 },
  stepText: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 10, lineHeight: 1.55, flex: 1, color: color.ink },
  hero: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay: { position: "absolute", bottom: 40, left: 40, right: 40, backgroundColor: "rgba(255,255,255,0.86)", padding: 24 },
  photo: { width: "100%", height: 150, objectFit: "cover", marginBottom: 12 },
  attribution: { fontFamily: "Inter", fontWeight: 400, fontSize: 7.5, color: color.stone, marginTop: 16 },
  // Toc / index
  tocRow: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 13, marginBottom: 10 },
  tocRecipe: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 9, color: color.stone, marginLeft: 12, marginTop: 2 },
  indexCols: { flexDirection: "row", flexWrap: "wrap", marginTop: 20 },
  indexItem: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 9, width: "50%", marginBottom: 4, color: color.ink },
  colophon: { flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" },
  colophonText: { fontFamily: "Inter", fontWeight: 500, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: color.stone },
});

function recipePage(
  page: Extract<PageModel, { kind: "recipe" }>,
  key: number,
) {
  const { recipe, template, attribution } = page;

  if (template === "full_bleed_photo" && recipe.image_url) {
    return (
      <Page key={key} size={PAGE} style={{ backgroundColor: color.snow }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={recipe.image_url} style={s.hero} />
        <View style={s.heroOverlay}>
          <Text style={s.recipeTitle}>{recipe.title}</Text>
          {attribution && (attribution.author || attribution.url) ? (
            <Text style={s.attribution}>via {attribution.author ?? attribution.platform}</Text>
          ) : null}
        </View>
      </Page>
    );
  }

  const showPhoto = template === "photo_and_recipe" && !!recipe.image_url;

  return (
    <Page key={key} size={PAGE} style={s.page}>
      <Text style={s.recipeTitle}>{recipe.title}</Text>
      {recipe.description ? <Text style={s.recipeDesc}>{recipe.description}</Text> : null}
      <Text style={s.meta}>
        SERVES {recipe.servings}
        {recipe.prep_min != null ? ` · PREP ${recipe.prep_min} MIN` : ""}
        {recipe.cook_min != null ? ` · COOK ${recipe.cook_min} MIN` : ""}
      </Text>

      <View style={s.columns}>
        <View style={s.colIngredients}>
          {showPhoto && recipe.image_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={recipe.image_url} style={s.photo} />
          ) : null}
          {recipe.ingredients.map((ing) => (
            <Text key={ing.id} style={s.ing}>
              {ing.quantity != null ? `${ing.quantity}${ing.unit ? " " + ing.unit : ""} ` : ""}
              {ing.name}
              {ing.note ? `, ${ing.note}` : ""}
            </Text>
          ))}
        </View>
        <View style={s.colSteps}>
          {recipe.steps.map((step, i) => (
            <View key={step.id} style={s.step}>
              <Text style={s.stepNum}>{i + 1}</Text>
              <Text style={s.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {attribution && (attribution.author || attribution.url) ? (
        <Text style={s.attribution}>
          via {attribution.author ?? attribution.platform}
          {attribution.url ? ` — ${attribution.url}` : ""}
        </Text>
      ) : null}
    </Page>
  );
}

function standardPage(page: PageModel, key: number) {
  switch (page.kind) {
    case "cover":
      return (
        <Page key={key} size={PAGE} style={{ backgroundColor: color.snow }}>
          <View style={s.cover}>
            <Text style={[s.eyebrow, s.eyebrowGran]}>Arv</Text>
            <View>
              <Text style={s.coverTitle}>{page.title}</Text>
              {page.subtitle ? <Text style={s.coverSub}>{page.subtitle}</Text> : null}
            </View>
            <Text style={s.coverAuthor}>{page.author ?? ""}</Text>
          </View>
        </Page>
      );
    case "dedication":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.center}>
            <Text style={s.dedication}>{page.text}</Text>
          </View>
        </Page>
      );
    case "toc":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <Text style={s.eyebrow}>Contents</Text>
          <View style={{ marginTop: 28 }}>
            {page.entries.map((e, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={s.tocRow}>{e.chapter}</Text>
                {e.recipes.map((r, j) => (
                  <Text key={j} style={s.tocRecipe}>{r}</Text>
                ))}
              </View>
            ))}
          </View>
        </Page>
      );
    case "chapter_opener":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.chapterCenter}>
            <Text style={[s.eyebrow, s.eyebrowGran]}>Chapter {page.index}</Text>
            <Text style={s.chapterTitle}>{page.title}</Text>
            {page.introText ? <Text style={s.chapterIntro}>{page.introText}</Text> : null}
          </View>
        </Page>
      );
    case "index":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <Text style={s.eyebrow}>Index</Text>
          <View style={s.indexCols}>
            {page.entries.map((e) => (
              <Text key={e} style={s.indexItem}>{e}</Text>
            ))}
          </View>
        </Page>
      );
    case "colophon":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.colophon}>
            <Text style={s.colophonText}>Samlet med Arv · arv.kitchen</Text>
          </View>
        </Page>
      );
    default:
      return null;
  }
}

export function BookDocument({ pages }: { pages: PageModel[] }) {
  return (
    <Document>
      {pages.map((page, i) =>
        page.kind === "recipe" ? recipePage(page, i) : standardPage(page, i),
      )}
    </Document>
  );
}

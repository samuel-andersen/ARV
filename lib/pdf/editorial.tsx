import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";
import type { PageModel } from "@/lib/book/layout";
import { creditLine } from "@/lib/book/labels";
import { ingredientLine, metaLine } from "@/lib/book/format";
import { color } from "@/lib/design/tokens";

// 20×25 cm in PDF points (1 cm = 28.3465 pt).
const CM = 28.3465;
const PAGE = { width: 20 * CM, height: 25 * CM };
const MX = 58; // horizontal margin

const s = StyleSheet.create({
  page: {
    backgroundColor: color.snow,
    color: color.ink,
    fontFamily: "Fraunces",
    fontWeight: 400,
    paddingTop: 64,
    paddingBottom: 78,
    paddingHorizontal: MX,
  },
  head: {
    position: "absolute",
    top: 32,
    left: MX,
    right: MX,
    textAlign: "center",
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 7.5,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: color.stone,
  },
  folio: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Fraunces",
    fontWeight: 400,
    fontSize: 10,
    color: color.stone,
  },
  folioDark: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Fraunces",
    fontWeight: 400,
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
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
  sectionLabel: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: 7.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: color.gran,
    marginBottom: 9,
  },
  rule: { borderTopWidth: 0.75, borderTopColor: color.line, marginTop: 16 },
  // Short centered ornamental rule
  centerRule: { width: 42, borderTopWidth: 0.75, borderTopColor: color.gran, marginVertical: 16 },

  // Cover — framed, symmetric, on Salvie.
  coverPage: { backgroundColor: color.salvie, position: "relative" },
  coverFrame: {
    position: "absolute",
    top: 26,
    left: 26,
    right: 26,
    bottom: 26,
    borderWidth: 0.75,
    borderColor: "#AEC0B2",
  },
  coverInner: {
    height: "100%",
    paddingVertical: 78,
    paddingHorizontal: 66,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverMark: { fontFamily: "Inter", fontWeight: 500, fontSize: 11, letterSpacing: 8, textTransform: "uppercase", color: color.gran },
  coverMid: { flexDirection: "column", alignItems: "center" },
  coverTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 44, lineHeight: 1.04, letterSpacing: -0.5, textAlign: "center", color: color.ink },
  coverSub: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 14, letterSpacing: 0.3, textAlign: "center", color: color.gran },
  coverBottom: { flexDirection: "column", alignItems: "center" },
  coverOrn: { width: 18, borderTopWidth: 0.75, borderTopColor: color.gran, marginBottom: 14 },
  coverAuthor: { fontFamily: "Inter", fontWeight: 400, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase", color: color.stone },
  coverImprint: { fontFamily: "Inter", fontWeight: 400, fontSize: 7, letterSpacing: 2, textTransform: "uppercase", color: color.stone, marginTop: 8 },

  // Interior title page — airy, on Snow.
  titlePage: { backgroundColor: color.snow, paddingVertical: 96, paddingHorizontal: 66, flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "100%" },
  titleMark: { fontFamily: "Inter", fontWeight: 500, fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: color.gran },
  titleMid: { flexDirection: "column", alignItems: "center" },
  titleTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: -0.5, textAlign: "center", color: color.ink },
  titleSub: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 13, textAlign: "center", color: color.gran },
  titleFoot: { flexDirection: "column", alignItems: "center" },
  titleAuthor: { fontFamily: "Inter", fontWeight: 400, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase", color: color.stone },
  titleImprint: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 10, color: color.stone, marginTop: 10 },

  // Dedication
  center: { flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" },
  dedication: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 15, lineHeight: 1.7, textAlign: "center", maxWidth: "72%", color: color.ink },

  // Chapter opener — grand, centered.
  chapterCenter: { flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" },
  chapterNumeral: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 84, lineHeight: 1, color: color.gran, letterSpacing: -1 },
  chapterKicker: { fontFamily: "Inter", fontWeight: 500, fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: color.stone, marginTop: 6 },
  chapterTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 34, lineHeight: 1.06, letterSpacing: -0.4, textAlign: "center", color: color.ink, marginTop: 6 },
  chapterIntro: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 12, lineHeight: 1.7, textAlign: "center", color: color.stone, marginTop: 16, maxWidth: "66%" },

  // Recipe
  recipeTitle: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 27, lineHeight: 1.08, letterSpacing: -0.4 },
  recipeDesc: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 11.5, lineHeight: 1.5, color: color.stone, marginTop: 6 },
  meta: { fontFamily: "Inter", fontWeight: 500, fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", color: color.gran, marginTop: 12 },
  columns: { flexDirection: "row", marginTop: 22, gap: 26 },
  colIngredients: { width: "35%" },
  colSteps: { flex: 1 },
  ing: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 10, lineHeight: 1.5, marginBottom: 5, color: color.ink },
  step: { flexDirection: "row", marginBottom: 10 },
  stepNum: { fontFamily: "Inter", fontWeight: 500, fontSize: 9, color: color.gran, width: 18, marginTop: 1 },
  stepText: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 10.5, lineHeight: 1.55, flex: 1, color: color.ink },

  // Full-bleed hero — image fills the page (100%), scrim + text overlay on top.
  hero: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" },
  heroTextWrap: { position: "absolute", bottom: 56, left: 56, right: 56 },
  heroKicker: { fontFamily: "Inter", fontWeight: 500, fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: 10 },
  heroTitle: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 34, lineHeight: 1.05, letterSpacing: -0.4, color: "#FFFFFF" },
  heroMeta: { fontFamily: "Inter", fontWeight: 500, fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginTop: 10 },

  photo: { width: "100%", height: 150, objectFit: "cover", marginBottom: 14 },
  attribution: { fontFamily: "Inter", fontWeight: 400, fontSize: 7.5, letterSpacing: 0.4, color: color.stone, marginTop: 18 },

  // TOC
  tocLeaderRow: { flexDirection: "row", alignItems: "flex-end" },
  tocChapter: { fontFamily: "Fraunces", fontWeight: 500, fontSize: 13, color: color.ink },
  tocRecipe: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 10, color: color.stone },
  tocDots: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: color.line, borderBottomStyle: "dotted", marginHorizontal: 7, marginBottom: 3 },

  // Index
  indexCols: { flexDirection: "row", flexWrap: "wrap", marginTop: 22 },
  indexItem: { width: "50%", marginBottom: 5, paddingRight: 16 },
  indexName: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 9.5, color: color.ink },
  indexPages: { fontFamily: "Fraunces", fontWeight: 400, fontSize: 9.5, color: color.stone },

  // Colophon
  colophon: { flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" },
  colophonMark: { fontFamily: "Inter", fontWeight: 500, fontSize: 10, letterSpacing: 6, textTransform: "uppercase", color: color.gran, marginBottom: 18 },
  colophonCredit: { fontFamily: "Fraunces", fontWeight: 300, fontSize: 12, color: color.gran, textAlign: "center", marginBottom: 14, maxWidth: "78%" },
  colophonText: { fontFamily: "Inter", fontWeight: 500, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: color.stone },
});

function RunningHead({ title }: { title: string }) {
  return <Text style={s.head} fixed>{title}</Text>;
}
function Folio({ dark }: { dark?: boolean }) {
  return <Text style={dark ? s.folioDark : s.folio} fixed render={({ pageNumber }) => `${pageNumber}`} />;
}

/** Bottom-anchored darkening scrim for legible text over a full-bleed photo. */
function HeroScrim() {
  return (
    <Svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }} viewBox="0 0 100 125" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="heroScrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.4" stopColor="#141413" stopOpacity={0} />
          <Stop offset="1" stopColor="#141413" stopOpacity={0.78} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="125" fill="url(#heroScrim)" />
    </Svg>
  );
}

function recipePage(page: Extract<PageModel, { kind: "recipe" }>, key: number, bookTitle: string) {
  const { recipe, template, attribution } = page;
  const credit = attribution && (attribution.author || attribution.url)
    ? `Etter ${attribution.author ?? attribution.platform}${attribution.url ? ` · ${attribution.platform}` : ""}`
    : null;

  if (template === "full_bleed_photo" && recipe.image_url) {
    return (
      <Page key={key} size={PAGE} style={{ backgroundColor: color.ink }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={recipe.image_url} style={s.hero} />
        <HeroScrim />
        <View style={s.heroTextWrap}>
          <Text style={s.heroKicker}>Oppskrift</Text>
          <Text style={s.heroTitle}>{recipe.title}</Text>
          <Text style={s.heroMeta}>{metaLine(recipe.servings, recipe.prep_min, recipe.cook_min)}</Text>
          {credit ? <Text style={[s.heroMeta, { textTransform: "none", letterSpacing: 0.3 }]}>{credit}</Text> : null}
        </View>
        <Folio dark />
      </Page>
    );
  }

  const showPhoto = template === "photo_and_recipe" && !!recipe.image_url;

  return (
    <Page key={key} size={PAGE} style={s.page}>
      <RunningHead title={bookTitle} />
      <Text style={s.recipeTitle}>{recipe.title}</Text>
      {recipe.description ? <Text style={s.recipeDesc}>{recipe.description}</Text> : null}
      <Text style={s.meta}>{metaLine(recipe.servings, recipe.prep_min, recipe.cook_min)}</Text>
      <View style={s.rule} />

      <View style={s.columns}>
        <View style={s.colIngredients}>
          {showPhoto && recipe.image_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={recipe.image_url} style={s.photo} />
          ) : null}
          <Text style={s.sectionLabel}>Ingredienser</Text>
          {recipe.ingredients.map((ing) => (
            <Text key={ing.id} style={s.ing}>
              {ingredientLine(ing.quantity, ing.unit, ing.name, ing.note)}
            </Text>
          ))}
        </View>
        <View style={s.colSteps}>
          <Text style={s.sectionLabel}>Fremgangsmåte</Text>
          {recipe.steps.map((step, i) => (
            <View key={step.id} style={s.step}>
              <Text style={s.stepNum}>{i + 1}</Text>
              <Text style={s.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {credit ? <Text style={s.attribution}>{credit}</Text> : null}
      <Folio />
    </Page>
  );
}

function standardPage(page: PageModel, key: number) {
  switch (page.kind) {
    case "cover":
      return (
        <Page key={key} size={PAGE} style={s.coverPage}>
          <View style={s.coverFrame} />
          <View style={s.coverInner}>
            <Text style={s.coverMark}>Arv</Text>
            <View style={s.coverMid}>
              <Text style={s.coverTitle}>{page.title}</Text>
              <View style={s.centerRule} />
              {page.subtitle ? <Text style={s.coverSub}>{page.subtitle}</Text> : null}
            </View>
            <View style={s.coverBottom}>
              <View style={s.coverOrn} />
              {page.author ? <Text style={s.coverAuthor}>Samlet av {page.author}</Text> : null}
              <Text style={s.coverImprint}>Innbundet i lin · Trykket i Norge</Text>
            </View>
          </View>
        </Page>
      );
    case "title":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.titlePage}>
            <Text style={s.titleMark}>Arv</Text>
            <View style={s.titleMid}>
              <Text style={s.titleTitle}>{page.title}</Text>
              <View style={s.centerRule} />
              {page.subtitle ? <Text style={s.titleSub}>{page.subtitle}</Text> : null}
            </View>
            <View style={s.titleFoot}>
              {page.author ? <Text style={s.titleAuthor}>Samlet av {page.author}</Text> : null}
              <Text style={s.titleImprint}>arv.kitchen</Text>
            </View>
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
          <Text style={s.eyebrow}>Innhold</Text>
          <View style={{ marginTop: 30 }}>
            {page.entries.map((e, i) => (
              <View key={i} style={{ marginBottom: 15 }}>
                <View style={s.tocLeaderRow}>
                  <Text style={s.tocChapter}>{e.chapter}</Text>
                  <View style={s.tocDots} />
                  <Text style={s.tocChapter}>{e.page}</Text>
                </View>
                {e.recipes.map((r, j) => (
                  <View key={j} style={[s.tocLeaderRow, { marginLeft: 14, marginTop: 4 }]}>
                    <Text style={s.tocRecipe}>{r.title}</Text>
                    <View style={s.tocDots} />
                    <Text style={s.tocRecipe}>{r.page}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <Folio />
        </Page>
      );
    case "chapter_opener":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.chapterCenter}>
            <Text style={s.chapterNumeral}>{page.index}</Text>
            <Text style={s.chapterKicker}>Kapittel</Text>
            <View style={s.centerRule} />
            <Text style={s.chapterTitle}>{page.title}</Text>
            {page.introText ? <Text style={s.chapterIntro}>{page.introText}</Text> : null}
          </View>
          <Folio />
        </Page>
      );
    case "index":
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <Text style={s.eyebrow}>Register</Text>
          <View style={s.indexCols}>
            {page.entries.map((e) => (
              <Text key={e.name} style={s.indexItem}>
                <Text style={s.indexName}>{e.name} </Text>
                <Text style={s.indexPages}>{e.pages.join(", ")}</Text>
              </Text>
            ))}
          </View>
          <Folio />
        </Page>
      );
    case "colophon": {
      const credit = creditLine(page.author, page.contributors);
      return (
        <Page key={key} size={PAGE} style={s.page}>
          <View style={s.colophon}>
            <Text style={s.colophonMark}>Arv</Text>
            {credit ? <Text style={s.colophonCredit}>{credit}</Text> : null}
            <Text style={s.colophonText}>Samlet med Arv · arv.kitchen</Text>
          </View>
        </Page>
      );
    }
    default:
      return null;
  }
}

export function BookDocument({ pages, title }: { pages: PageModel[]; title: string }) {
  return (
    <Document>
      {pages.map((page, i) =>
        page.kind === "recipe" ? recipePage(page, i, title) : standardPage(page, i),
      )}
    </Document>
  );
}

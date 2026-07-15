/**
 * Verifies the key-free import path (heuristic extraction + rule-based
 * normalization) end-to-end. Run: npx tsx scripts/verify-import.ts
 */
import { StubExtractionProvider } from "@/lib/providers/extraction";
import { StubNormalizationProvider } from "@/lib/providers/normalization";

const messy = `garlic butter shrimp 🍤🔥 SO GOOD
Serves 4

Ingredients
3 fedd hvitløk, finhakket 🧄
2 tbsp butter
a big handful shrimp
salt to taste

Method
melt butter add garlic cook 30 sec then add shrimp until pink dont overcook!!
squeeze lemon serve w bread 🍋🍞`;

async function main() {
  const extracted = await new StubExtractionProvider().extract({ text: messy });
  const normalized = await new StubNormalizationProvider().normalize(extracted);

  console.log("is_recipe:", normalized.is_recipe, "| servings:", normalized.servings);
  console.log("\nIngredients (normalized):");
  for (const i of normalized.ingredients) {
    const qty = i.quantity != null ? `${i.quantity}${i.unit ? " " + i.unit : ""} ` : "";
    console.log(
      `  - ${qty}${i.name}${i.note ? ", " + i.note : ""}${i.needs_review ? "  [needs review]" : ""}`,
    );
  }
  console.log("\nSteps (normalized):");
  normalized.steps.forEach((s, n) => {
    const timer = s.timer_seconds ? ` (${s.timer_seconds}s timer)` : "";
    console.log(`  ${n + 1}. ${s.text}${timer}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

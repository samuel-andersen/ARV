/**
 * Typographic formatting shared by the live preview and the print PDF, so the
 * book reads identically in both. Norwegian conventions: vulgar fractions,
 * comma decimals, and a non-breaking space between a quantity and its unit so
 * "500 g" never breaks across a line.
 */

export const NBSP = " ";

const FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.2, "⅕"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.375, "⅜"],
  [0.5, "½"],
  [0.625, "⅝"],
  [0.667, "⅔"],
  [0.75, "¾"],
  [0.875, "⅞"],
];

/** 1.5 → "1½", 0.5 → "½", 2 → "2", 1.25 → "1¼", 1.4 → "1,4". */
export function fmtQuantity(q: number | null): string {
  if (q == null) return "";
  const whole = Math.trunc(q);
  const rem = Math.abs(q - whole);
  for (const [v, glyph] of FRACTIONS) {
    if (Math.abs(rem - v) < 0.02) return `${whole || ""}${glyph}`;
  }
  return (Math.round(q * 100) / 100).toString().replace(".", ",");
}

/** A full ingredient line: "1½ dl fløte, romtemperert". */
export function ingredientLine(
  quantity: number | null,
  unit: string | null,
  name: string,
  note?: string | null,
): string {
  const qty = fmtQuantity(quantity);
  let head = "";
  if (qty) head = unit ? `${qty}${NBSP}${unit} ` : `${qty} `;
  else if (unit) head = `${unit} `;
  return `${head}${name}${note ? `, ${note}` : ""}`;
}

/** Recipe meta, Norwegian: "4 PORSJONER · 30 MIN FORARBEID · 12 MIN STEKING". */
export function metaLine(
  servings: number,
  prepMin: number | null,
  cookMin: number | null,
): string {
  const parts = [`${servings} porsjoner`];
  if (prepMin != null) parts.push(`${prepMin}${NBSP}min forarbeid`);
  if (cookMin != null) parts.push(`${cookMin}${NBSP}min steking`);
  return parts.join("  ·  ");
}

/**
 * Arv Design System v1.0 — token source of truth.
 *
 * These values are the law. One hue (green), seven values, fixed roles.
 * This module is consumed by JS/TS surfaces that cannot read CSS variables
 * (PDF generation, OG card rendering, canvas work). The same values are
 * mirrored into CSS custom properties in `app/globals.css` via `@theme`.
 *
 * Rules encoded here — do not violate downstream:
 *  - Gran is the ONLY interactive color (buttons, links, focus, accent text).
 *  - Salvie is a light accent surface only — never a button, never long body-text bg.
 *  - Stone must never sit on Salvie (fails contrast) — use Gran there instead.
 *  - Ink is for rare dark punctuation (footer, small blocks), never full dark sections.
 *  - No shadows/gradients on UI. Structure is drawn with 1px hairlines (Line).
 *  - Zero border-radius everywhere in app chrome.
 */

export const color = {
  /** Pure white — cards, book pages, the "paper" the recipe lives on. */
  snow: "#FFFFFF",
  /** The app canvas — warm off-white (knekt hvit, ikke klinisk). */
  papir: "#FBFAF8",
  /** Secondary surface. */
  mist: "#F5F5F4",
  /** Hairlines only — never a fill. */
  line: "#E2E2E0",
  /** Light identity accent: bands, badges, tinted panels. Never buttons. */
  salvie: "#E3EAE4",
  /** Deep identity — the ONLY interactive color. */
  gran: "#49604F",
  /** Secondary text. Never on Salvie. */
  stone: "#6F6F6C",
  /** Primary text + rare dark punctuation. */
  ink: "#141413",
  /** Placeholders / disabled. */
  fog: "#EBEBEA",

  /** Semantic — product states only. */
  positive: "#2E6B4F",
  negative: "#9B3B30",
} as const;

/** Foreground values when placed on the Ink surface. */
export const onInk = {
  heading: "#FFFFFF",
  body: "#C9C9C7",
  muted: "#6F6F6C",
} as const;

/**
 * Two voices. Inter carries the chrome — weights constrained to 300 (all
 * display sizes; thin-at-large is the signature), 400 body, 500 labels/buttons,
 * never bold, never italic. Source Serif 4 is "where the food lives": recipe
 * titles, step numerals, stories, notes and every book page — italic (300)
 * for the handwritten, personal voice. The contrast between them IS the
 * identity: calm chrome, warm food.
 */
export const font = {
  sans: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
  /** The serif voice (recipe/book surfaces). */
  serif: "var(--font-serif), 'Source Serif 4', ui-serif, Georgia, serif",
  /** @deprecated alias for `serif`. */
  bookSerif: "Source Serif 4, ui-serif, Georgia, serif",
} as const;

export const fontWeight = {
  display: 300,
  body: 400,
  label: 500,
} as const;

/** The label treatment: 11px, +0.22em, uppercase, Stone (Gran on Salvie). */
export const label = {
  fontSize: "11px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  fontWeight: fontWeight.label,
} as const;

/** 8pt spacing scale. */
export const space = {
  0: "0px",
  1: "8px",
  2: "16px",
  3: "24px",
  4: "32px",
  5: "40px",
  6: "48px",
  8: "64px",
  10: "80px",
  12: "96px",
  16: "128px",
} as const;

/** Motion. One orchestrated moment per view; skeletons never spinners. */
export const motion = {
  fast: "150ms",
  base: "250ms",
  slow: "500ms",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const radius = {
  /** Zero border-radius is the law for app chrome. */
  none: "0px",
} as const;

export type ColorToken = keyof typeof color;

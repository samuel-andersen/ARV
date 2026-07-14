"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/label";
import type { Ingredient, Step } from "@/lib/schemas/recipe";

/** Format a scaled quantity without ugly floats (1.5, 0.33 → ⅓ish rounding). */
function fmtQty(q: number): string {
  const rounded = Math.round(q * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function fmtTimer(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} h ${rem} min` : `${h} h`;
}

export function RecipeBody({
  baseServings,
  ingredients,
  steps,
}: {
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
}) {
  const [servings, setServings] = useState(baseServings);
  const factor = baseServings > 0 ? servings / baseServings : 1;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
      {/* Ingredients + scaler */}
      <div>
        <div className="flex items-center justify-between">
          <Eyebrow>Ingredients</Eyebrow>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="h-7 w-7 border border-line text-stone hover:border-gran hover:text-gran"
              aria-label="Fewer servings"
            >
              −
            </button>
            <span className="w-16 text-center text-sm font-light text-ink">
              serves {servings}
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              className="h-7 w-7 border border-line text-stone hover:border-gran hover:text-gran"
              aria-label="More servings"
            >
              +
            </button>
          </div>
        </div>
        <ul className="mt-5 flex flex-col">
          {ingredients.map((ing) => (
            <li
              key={ing.id}
              className="flex items-baseline justify-between gap-3 border-b border-line py-2.5"
            >
              <span className="font-light text-ink">
                {ing.name}
                {ing.note ? (
                  <span className="text-stone">, {ing.note}</span>
                ) : null}
                {ing.needs_review ? (
                  <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-negative">
                    check
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-light text-stone">
                {ing.quantity != null
                  ? `${fmtQty(ing.quantity * factor)}${ing.unit ? " " + ing.unit : ""}`
                  : ing.unit ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <Eyebrow>Method</Eyebrow>
        <ol className="mt-5 flex flex-col gap-6">
          {steps.map((s, i) => (
            <li key={s.id} className="flex gap-4">
              <span className="w-6 shrink-0 text-lg font-light text-fog">
                {i + 1}
              </span>
              <div>
                <p className="font-light leading-relaxed text-ink">{s.text}</p>
                {s.timer_seconds ? (
                  <span className="mt-2 inline-block bg-salvie px-2 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gran">
                    {fmtTimer(s.timer_seconds)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Ingredient, Step } from "@/lib/schemas/recipe";

/** Format a scaled quantity without ugly floats. */
function fmtQty(q: number): string {
  const rounded = Math.round(q * 100) / 100;
  return String(rounded);
}

function fmtTimer(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} MIN`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} T ${rem} MIN` : `${h} T`;
}

const LABEL = "text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone";

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
    <div className="flex flex-col gap-10">
      {/* Ingredients + serving scaler */}
      <div>
        <div className="flex items-center justify-between">
          <span className={LABEL}>Ingredienser</span>
          <div className="flex items-stretch border border-line bg-papir">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="tap border-r border-line px-3.5 py-1.5 text-gran"
              aria-label="Færre porsjoner"
            >
              −
            </button>
            <span className="px-3 py-1.5 text-xs text-ink tabular-nums">
              {servings} porsjoner
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              className="tap border-l border-line px-3.5 py-1.5 text-gran"
              aria-label="Flere porsjoner"
            >
              +
            </button>
          </div>
        </div>
        <ul className="mt-4 flex flex-col">
          {ingredients.map((ing) => (
            <li
              key={ing.id}
              className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 text-[13.5px]"
            >
              <span className="text-ink">
                {ing.name}
                {ing.note ? <span className="text-stone">, {ing.note}</span> : null}
              </span>
              <span className="shrink-0 text-stone">
                {ing.needs_review ? (
                  <span className="text-negative">—</span>
                ) : ing.quantity != null ? (
                  `${fmtQty(ing.quantity * factor)}${ing.unit ? " " + ing.unit : ""}`
                ) : (
                  (ing.unit ?? "")
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps — serif italic numerals, Salvie timer chips */}
      <div>
        <span className={LABEL}>Fremgangsmåte</span>
        <ol className="mt-4 flex flex-col gap-3.5">
          {steps.map((s, i) => (
            <li key={s.id} className="flex gap-3.5 text-[13.5px] leading-relaxed">
              <span className="serif-italic shrink-0 text-[15px] text-gran">{i + 1}</span>
              <p className="text-ink">
                {s.text}
                {s.timer_seconds ? (
                  <span className="ml-2 inline-block whitespace-nowrap bg-salvie px-2 py-0.5 text-[9px] font-medium tracking-[0.12em] text-gran align-middle">
                    {fmtTimer(s.timer_seconds)}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

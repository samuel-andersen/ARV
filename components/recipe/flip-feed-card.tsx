"use client";

import { useState } from "react";
import Link from "next/link";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { RecipeListItem } from "@/lib/data/recipes";

/**
 * The signature feed "bla-kort": photo on the front, the recipe's ingredients
 * and first step on the back. Tap to flip; "Åpne oppskriften" opens it. Mirrors
 * the iOS handoff (perspective 1400px, 600ms flip, book-page back).
 */
export function FlipFeedCard({ recipe }: { recipe: RecipeListItem }) {
  const [flipped, setFlipped] = useState(false);
  const source = recipe.is_original
    ? "Din oppskrift"
    : (recipe.source_author ?? recipe.source_platform);

  return (
    <div style={{ perspective: "1400px" }}>
      <div className={cn("flip relative aspect-[4/5.3] w-full", flipped && "is-flipped")}>
        {/* Front — photo */}
        <button
          type="button"
          onClick={() => {
            tapHaptic();
            setFlipped(true);
          }}
          className="flip-face absolute inset-0 flex flex-col overflow-hidden border border-line bg-snow text-left"
        >
          <div className="relative flex-1 overflow-hidden bg-mist">
            {recipe.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.image_url}
                alt={recipe.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-salvie">
                <span className="serif text-3xl font-light text-gran/50">Arv</span>
              </div>
            )}
            <span className="absolute left-3 top-3 bg-snow px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gran">
              {recipe.is_original ? "Egen" : recipe.source_platform}
            </span>
            {!recipe.normalized && (
              <span className="absolute right-3 top-3 bg-snow px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-negative">
                Se over
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3.5">
            <div className="min-w-0">
              <div className="serif truncate text-[17px] font-normal leading-tight">
                {recipe.title}
              </div>
              <div className="mt-1 truncate text-[11px] font-light text-stone">{source}</div>
            </div>
            <span className="shrink-0 text-right text-[10px] font-light leading-tight text-stone">
              Trykk for
              <br />å bla om
            </span>
          </div>
        </button>

        {/* Back — the book page */}
        <div
          onClick={() => setFlipped(false)}
          className="flip-face flip-back serif absolute inset-0 flex cursor-pointer flex-col overflow-hidden border border-line bg-papir p-4"
          style={{ boxShadow: "inset 6px 0 14px -10px rgba(20,20,19,0.18)" }}
        >
          <div className="truncate text-[17px] font-normal leading-tight">{recipe.title}</div>

          <div className="mb-1 mt-3 text-[8px] font-medium uppercase tracking-[0.16em] text-stone [font-family:var(--font-sans)]">
            Ingredienser
          </div>
          <div className="flex flex-col">
            {recipe.previewIngredients.length > 0 ? (
              recipe.previewIngredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-2 border-b border-line py-[3px] text-[11px]"
                >
                  <span className="truncate">{ing.name}</span>
                  <span className="shrink-0 text-stone">{ing.amount}</span>
                </div>
              ))
            ) : (
              <div className="py-[3px] text-[11px] text-stone">Ingen ingredienser ennå.</div>
            )}
          </div>

          {recipe.firstStep && (
            <>
              <div className="mb-1 mt-3 text-[8px] font-medium uppercase tracking-[0.16em] text-stone [font-family:var(--font-sans)]">
                Fremgangsmåte
              </div>
              <p className="line-clamp-3 text-[11px] leading-[1.5]">{recipe.firstStep}</p>
            </>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
            <span className="truncate text-[7.5px] font-medium uppercase tracking-[0.12em] text-stone [font-family:var(--font-sans)]">
              {source}
            </span>
            <Link
              href={`/recipes/${recipe.id}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-[12px] font-medium text-gran [font-family:var(--font-sans)]"
            >
              Åpne oppskriften →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

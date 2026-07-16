"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createVariant } from "@/lib/actions/recipes";
import { tapHaptic } from "@/lib/haptics";

/**
 * Recipe edit bar — Rediger · Vis originalen · Lag min variant. "Vis originalen"
 * reveals the untouched imported text (the original is always preserved);
 * "Lag min variant" forks an editable copy.
 */
export function RecipeActions({
  recipeId,
  sourceRaw,
  tags,
}: {
  recipeId: string;
  sourceRaw: string | null;
  tags: string[];
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function makeVariant() {
    tapHaptic();
    setError(null);
    startTransition(async () => {
      const res = await createVariant(recipeId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-2.5">
        <Link href={`/recipes/${recipeId}/edit`} className="text-xs font-medium text-gran hover:text-ink">
          Rediger
        </Link>
        {sourceRaw && (
          <button
            type="button"
            onClick={() => {
              tapHaptic();
              setShowOriginal((s) => !s);
            }}
            className="text-xs font-medium text-gran hover:text-ink"
          >
            {showOriginal ? "Skjul originalen" : "Vis originalen"}
          </button>
        )}
        <button
          type="button"
          onClick={makeVariant}
          disabled={pending}
          className="text-xs font-medium text-gran hover:text-ink disabled:text-stone"
        >
          {pending ? "Lager…" : "Lag min variant"}
        </button>
        {tags.length > 0 && (
          <span className="ml-auto flex flex-wrap gap-x-3 text-[11px] font-light text-stone">
            {tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </span>
        )}
      </div>

      {showOriginal && sourceRaw && (
        <div className="bg-salvie px-4 py-3.5">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-gran">
            Originalen · slik den ble hentet
          </span>
          <p className="serif-italic mt-2 whitespace-pre-wrap text-[13px] font-light leading-relaxed text-gran">
            {sourceRaw}
          </p>
          <p className="mt-2 text-[11px] font-light text-gran">Originalen bevares alltid.</p>
        </div>
      )}

      {error && <p className="text-xs font-light text-negative">{error}</p>}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { FlipFeedCard } from "@/components/recipe/flip-feed-card";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { RecipeListItem } from "@/lib/data/recipes";

/**
 * The library feed with the design's horizontal category chips. Categories are
 * derived from the recipes' own tags (most common first) so a chip never
 * points at an empty shelf. Filtering is instant and client-side — the native
 * feel the handoff calls for.
 */
export function LibraryFeed({ recipes }: { recipes: RecipeListItem[] }) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) {
      for (const t of r.tags) {
        const key = t.trim().toLowerCase();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [recipes]);

  const hasFavorites = useMemo(() => recipes.some((r) => r.isFavorite), [recipes]);
  const hasCooked = useMemo(() => recipes.some((r) => r.lastCookedAt), [recipes]);

  // filter key: "" = all, "fav", "cooked", or "tag:<name>"
  const [filter, setFilter] = useState("");

  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  const { shown, heading } = useMemo(() => {
    if (filter === "fav") {
      return { shown: recipes.filter((r) => r.isFavorite), heading: "Favoritter" };
    }
    if (filter === "cooked") {
      const cooked = recipes
        .filter((r) => r.lastCookedAt)
        .sort((a, b) => (a.lastCookedAt! < b.lastCookedAt! ? 1 : -1));
      return { shown: cooked, heading: "Laget nylig" };
    }
    if (filter.startsWith("tag:")) {
      const tag = filter.slice(4);
      return {
        shown: recipes.filter((r) => r.tags.some((t) => t.toLowerCase() === tag)),
        heading: cap(tag),
      };
    }
    return { shown: recipes, heading: "Biblioteket" };
  }, [filter, recipes]);

  const showChips = hasFavorites || hasCooked || categories.length > 0;

  return (
    <>
      {showChips && (
        <div className="scroll-y -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip label="Alle" active={filter === ""} onClick={() => setFilter("")} />
          {hasFavorites && (
            <Chip label="Favoritter" active={filter === "fav"} onClick={() => setFilter("fav")} />
          )}
          {hasCooked && (
            <Chip label="Laget nylig" active={filter === "cooked"} onClick={() => setFilter("cooked")} />
          )}
          {categories.map((c) => (
            <Chip key={c} label={cap(c)} active={filter === `tag:${c}`} onClick={() => setFilter(`tag:${c}`)} />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-baseline justify-between">
        <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
          {heading}
        </span>
        <span className="text-[11.5px] font-light text-stone">
          {shown.length} {shown.length === 1 ? "oppskrift" : "oppskrifter"}
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <li key={r.id}>
            <FlipFeedCard recipe={r} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        tapHaptic();
        onClick();
      }}
      className={cn(
        "tap flex-none border px-4 py-2 text-[12.5px] transition-colors duration-[250ms]",
        active
          ? "border-gran bg-gran font-medium text-snow"
          : "border-line bg-snow text-gran hover:border-gran",
      )}
    >
      {label}
    </button>
  );
}

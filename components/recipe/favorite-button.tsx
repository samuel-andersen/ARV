"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/organize";
import { tapHaptic, okHaptic } from "@/lib/haptics";

/** Heart toggle — marks a recipe as one of the user's favorites (optimistic). */
export function FavoriteButton({
  recipeId,
  initial,
}: {
  recipeId: string;
  initial: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !fav;
    tapHaptic();
    setFav(next); // optimistic
    if (next) okHaptic();
    startTransition(async () => {
      const res = await toggleFavorite(recipeId, next);
      if (res?.error) setFav(!next); // revert on failure
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Fjern fra favoritter" : "Legg til i favoritter"}
      className="tap flex h-10 w-10 shrink-0 items-center justify-center text-gran disabled:opacity-60"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={fav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20.5s-7-4.35-9.3-8.7C1.2 8.9 2.5 5.8 5.6 5.3c1.9-.3 3.5.7 4.4 2.1.9-1.4 2.5-2.4 4.4-2.1 3.1.5 4.4 3.6 2.9 6.5C19 16.15 12 20.5 12 20.5Z" />
      </svg>
    </button>
  );
}

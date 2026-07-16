"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";
import { tapHaptic } from "@/lib/haptics";

/**
 * Two-tap destructive confirm — no jarring browser dialog. First tap arms
 * ("Bekreft sletting"), second deletes; tapping away or 4s later disarms.
 */
export function DeleteRecipeButton({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    tapHaptic();
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    startTransition(() => void deleteRecipe(id));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={
        "tap text-[11px] font-medium uppercase tracking-[0.22em] transition-colors " +
        (armed ? "text-negative" : "text-stone hover:text-negative")
      }
    >
      {pending ? "Sletter…" : armed ? "Bekreft sletting" : "Slett oppskrift"}
    </button>
  );
}

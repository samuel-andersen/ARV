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
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    tapHaptic();
    if (!armed) {
      setError(false);
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    startTransition(async () => {
      try {
        await deleteRecipe(id);
      } catch {
        // Success throws a redirect (handled by the framework); a real failure
        // lands here so the button recovers instead of hanging on "Sletter…".
        setError(true);
        setArmed(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={
        "tap text-[11px] font-medium uppercase tracking-[0.22em] transition-colors " +
        (armed || error ? "text-negative" : "text-stone hover:text-negative")
      }
    >
      {pending
        ? "Sletter…"
        : error
          ? "Kunne ikke slette — prøv igjen"
          : armed
            ? "Bekreft sletting"
            : "Slett oppskrift"}
    </button>
  );
}

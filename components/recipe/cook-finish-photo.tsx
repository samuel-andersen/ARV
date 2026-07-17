"use client";

import { useRef, useState } from "react";
import { uploadRecipeCover } from "@/lib/upload/recipe-photo";
import { setRecipeImage } from "@/lib/actions/recipes";
import { PhotoGuide } from "@/components/recipe/photo-guide";
import { tapHaptic, okHaptic, alertHaptic } from "@/lib/haptics";

/**
 * The close of the cook loop: having just made the dish, the owner photographs
 * their result — a print-quality shot, taken at the exact emotional moment the
 * dish is theirs. It becomes the recipe's cover (and flows into the book). Only
 * shown to the recipe's owner; captured photo lifts the whole book's quality.
 */
export function CookFinishPhoto({
  recipeId,
  userId,
  hasImage,
  onSaved,
}: {
  recipeId: string;
  userId: string;
  hasImage: boolean;
  /** Notifies the parent so it can refresh the recipe on close. */
  onSaved?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    tapHaptic();
    try {
      const up = await uploadRecipeCover({ file, userId, recipeId });
      if (up.error || !up.url) throw new Error(up.error ?? "Kunne ikke laste opp bildet.");
      const res = await setRecipeImage(recipeId, up.url);
      if (res?.error) throw new Error(res.error);
      okHaptic();
      setSavedUrl(up.url);
      onSaved?.(up.url);
    } catch (err) {
      alertHaptic();
      setError(err instanceof Error ? err.message : "Kunne ikke laste opp bildet.");
    } finally {
      setBusy(false);
    }
  }

  // Saved — show the result, framed, with a quiet confirmation.
  if (savedUrl) {
    return (
      <div className="mt-8 flex items-center gap-4 bg-salvie p-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={savedUrl}
          alt="Ditt bilde av retten"
          className="h-16 w-16 shrink-0 object-cover"
          decoding="async"
        />
        <div>
          <p className="text-[13px] font-medium text-gran">Lagt til i boka ✓</p>
          <p className="mt-0.5 text-[12px] font-light text-stone">
            Ditt bilde er nå forsiden på oppskriften.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="tap flex w-full items-center gap-4 bg-salvie p-4 text-left disabled:opacity-70"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-snow text-gran">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
            <circle cx="12" cy="13" r="3.4" />
          </svg>
        </span>
        <span>
          <span className="serif block text-[16px] leading-tight text-ink">
            {busy ? "Laster opp…" : hasImage ? "Ta et nytt bilde av retten" : "Ta et bilde av retten"}
          </span>
          <span className="mt-0.5 block text-[12px] font-light text-gran">
            Slik ble din — den blir forsiden i boka.
          </span>
        </span>
      </button>
      <div className="mt-2.5">
        <PhotoGuide label="Tips til et bra bilde →" />
      </div>
      {error && <p className="mt-2 text-[12px] font-light text-negative">{error}</p>}
    </div>
  );
}

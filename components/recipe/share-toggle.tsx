"use client";

import { useState, useTransition } from "react";
import { setRecipeSharing } from "@/lib/actions/recipes";
import { Eyebrow } from "@/components/ui/label";

export function ShareToggle({
  recipeId,
  initialPublic,
  initialSlug,
  siteUrl,
}: {
  recipeId: string;
  initialPublic: boolean;
  initialSlug: string | null;
  siteUrl: string;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url = slug ? `${siteUrl}/r/${slug}` : "";

  function toggle() {
    startTransition(async () => {
      const res = await setRecipeSharing(recipeId, !isPublic);
      if (!res.error) {
        setIsPublic(!isPublic);
        setSlug(res.slug ?? null);
        setCopied(false);
      }
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is visible to select manually */
    }
  }

  return (
    <div className="border border-line p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Del oppskrift</Eyebrow>
          <p className="mt-2 text-sm font-light text-stone">
            {isPublic
              ? "Alle med lenken kan se denne oppskriften."
              : "Slå på en offentlig lenke for å dele oppskriften."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          role="switch"
          aria-checked={isPublic}
          className={`relative h-6 w-11 shrink-0 border transition-colors duration-150 ${
            isPublic ? "border-gran bg-gran" : "border-line bg-snow"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 bg-snow transition-all duration-150 ${
              isPublic ? "left-6 bg-snow" : "left-0.5 bg-stone"
            }`}
          />
        </button>
      </div>

      {isPublic && url && (
        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 flex-1 border border-line bg-mist px-3 text-sm text-ink focus:border-gran focus:outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="h-10 shrink-0 border border-line px-4 text-sm font-medium text-gran hover:border-gran"
          >
            {copied ? "Kopiert" : "Kopier"}
          </button>
        </div>
      )}
    </div>
  );
}

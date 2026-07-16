"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setRecipeImage } from "@/lib/actions/recipes";
import { tapHaptic, okHaptic, alertHaptic } from "@/lib/haptics";

const MAX_EDGE = 1600; // downscale phone photos before upload
const BUCKET = "recipe-images";

/**
 * Downscale a huge photo in the browser so uploads stay small and the hero
 * loads fast. Falls back to the original file if the canvas path fails.
 */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * Cover-photo uploader for a recipe. Shows a large "Legg til bilde" prompt over
 * the empty (Salvie) hero, or a discreet "Bytt bilde" chip once a photo exists.
 * Uploads straight to Storage from the browser (own uid/ folder), then persists
 * the public URL via a server action and refreshes.
 */
export function RecipeImageUpload({
  recipeId,
  userId,
  hasImage,
}: {
  recipeId: string;
  userId: string;
  hasImage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const working = busy || pending;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    setError(null);
    setBusy(true);
    tapHaptic();
    try {
      const supabase = createClient();
      const body = await shrink(file);
      const ext = body.type === "image/jpeg" ? "jpg" : file.name.split(".").pop() || "jpg";
      const path = `${userId}/${recipeId}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { upsert: true, contentType: body.type || file.type });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const res = await setRecipeImage(recipeId, pub.publicUrl);
      if (res?.error) throw new Error(res.error);

      okHaptic();
      startTransition(() => router.refresh());
    } catch (err) {
      alertHaptic();
      setError(err instanceof Error ? err.message : "Kunne ikke laste opp bildet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />

      {hasImage ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={working}
          className="tap absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-snow/85 px-3 py-1.5 text-[11px] font-medium text-gran shadow-sm backdrop-blur disabled:opacity-60"
        >
          {working ? "Laster opp…" : "Bytt bilde"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={working}
          className="tap absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-gran disabled:opacity-70"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-snow/80 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="1.5" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m3 17 5-4 4 3 3-2 6 5" />
            </svg>
          </span>
          <span className="text-[13px] font-medium">
            {working ? "Laster opp…" : "Legg til bilde"}
          </span>
        </button>
      )}

      {error && (
        <p className="absolute inset-x-0 bottom-0 z-10 bg-negative/90 px-3 py-1.5 text-center text-[11px] font-light text-snow">
          {error}
        </p>
      )}
    </>
  );
}

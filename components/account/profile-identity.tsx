"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions/profile";
import { tapHaptic, okHaptic, alertHaptic } from "@/lib/haptics";

const AVATAR_EDGE = 800; // avatars never need more than this
const BUCKET = "avatars";

/** Center-crop to a square and downscale, so avatars are small and uniform. */
async function squareCrop(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const out = Math.min(AVATAR_EDGE, side);
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * Profile header — avatar (with a camera button to set/replace the photo),
 * name, and a short bio. "Rediger" reveals an inline editor for name + bio.
 * The photo lives in the avatars bucket (own uid/ folder) and is shown across
 * the app and on the book cover.
 */
export function ProfileIdentity({
  userId,
  name,
  initial,
  avatarUrl,
  bio,
  planLabel,
}: {
  userId: string;
  name: string;
  initial: string;
  avatarUrl: string | null;
  bio: string | null;
  planLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [bioInput, setBioInput] = useState(bio ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const working = busy || pending;

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    tapHaptic();
    try {
      const supabase = createClient();
      const blob = await squareCrop(file);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const res = await updateProfile({ avatarUrl: pub.publicUrl });
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

  function saveDetails() {
    setError(null);
    setBusy(true);
    tapHaptic();
    startTransition(async () => {
      const res = await updateProfile({ displayName: nameInput, bio: bioInput });
      setBusy(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      okHaptic();
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="pt-2">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />

      <div className="flex items-center gap-4">
        {/* Avatar with a camera button. */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={working}
            aria-label={avatarUrl ? "Bytt profilbilde" : "Legg til profilbilde"}
            className="tap block h-[72px] w-[72px] overflow-hidden bg-salvie disabled:opacity-70"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full object-cover"
                decoding="async"
              />
            ) : (
              <span className="serif flex h-full w-full items-center justify-center text-[28px] text-gran">
                {initial}
              </span>
            )}
          </button>
          <span
            className="pointer-events-none absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gran text-snow shadow-sm"
            aria-hidden
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </span>
        </div>

        {!editing && (
          <div className="min-w-0">
            <h1 className="serif truncate text-[24px] font-normal leading-tight text-ink">{name}</h1>
            <p className="mt-1 text-[12.5px] font-light leading-snug text-stone">
              {bio ?? "Samler til familien"} · {planLabel}
            </p>
            <button
              type="button"
              onClick={() => {
                tapHaptic();
                setNameInput(name);
                setBioInput(bio ?? "");
                setEditing(true);
              }}
              className="tap mt-1.5 text-xs font-medium text-gran hover:text-ink"
            >
              Rediger profil
            </button>
          </div>
        )}
      </div>

      {/* Inline editor. */}
      {editing && (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">Navn</span>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={60}
              placeholder="Ditt navn"
              className="serif border border-line bg-snow px-3 py-2.5 text-[16px] text-ink outline-none focus:border-gran"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">Om deg</span>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              maxLength={160}
              rows={2}
              placeholder="F.eks. Samler oppskriftene til familien"
              className="resize-none border border-line bg-snow px-3 py-2.5 text-[14px] font-light text-ink outline-none focus:border-gran"
            />
            <span className="text-right text-[10px] font-light text-stone">{bioInput.length}/160</span>
          </label>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={saveDetails}
              disabled={working}
              className="tap bg-gran px-5 py-2.5 text-[13px] font-medium text-snow disabled:opacity-60"
            >
              {working ? "Lagrer…" : "Lagre"}
            </button>
            <button
              type="button"
              onClick={() => {
                tapHaptic();
                setEditing(false);
                setError(null);
              }}
              disabled={working}
              className="tap border border-line px-5 py-2.5 text-[13px] font-medium text-gran hover:border-gran disabled:opacity-60"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-light text-negative">{error}</p>}
    </div>
  );
}

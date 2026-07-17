import { createClient } from "@/lib/supabase/client";

// Keep enough resolution for a full-page print at 300 PPI (~2400px on the long
// edge for a 20cm page); cap only the truly huge originals so uploads stay sane.
const MAX_EDGE = 3000;
// Below this a photo starts to look soft on a full book page — callers may warn.
export const PRINT_MIN_EDGE = 2000;
const BUCKET = "recipe-images";

type Prepared = { blob: Blob; longEdge: number };

/**
 * Read the photo, note its true resolution (for print guidance), and downscale
 * only if it's larger than we need. Falls back to the original file on any
 * canvas failure.
 */
async function prepare(file: File): Promise<Prepared> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return { blob: file, longEdge: 0 };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_EDGE / longEdge);
    if (scale >= 1) return { blob: file, longEdge };

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, longEdge };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    return { blob: blob ?? file, longEdge };
  } catch {
    return { blob: file, longEdge: 0 };
  }
}

/**
 * Upload a recipe cover photo straight from the browser to the recipe-images
 * bucket (own uid/ folder), returning the public URL. Shared by the recipe
 * hero uploader and the cook-mode "photograph your result" step. The caller
 * persists the URL via the setRecipeImage server action.
 */
export async function uploadRecipeCover({
  file,
  userId,
  recipeId,
}: {
  file: File;
  userId: string;
  recipeId: string;
}): Promise<{ url?: string; longEdge?: number; error?: string }> {
  try {
    const supabase = createClient();
    const { blob, longEdge } = await prepare(file);
    const ext = blob.type === "image/jpeg" ? "jpg" : file.name.split(".").pop() || "jpg";
    const path = `${userId}/${recipeId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type || file.type });
    if (upErr) return { error: upErr.message };

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, longEdge };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunne ikke laste opp bildet." };
  }
}

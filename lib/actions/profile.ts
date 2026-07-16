"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 60;
const MAX_BIO = 160;

/**
 * Update the signed-in user's profile. Any subset of fields may be provided;
 * `undefined` leaves a field untouched, `null` clears it (avatar/bio). Writes go
 * through the profiles_update_own RLS policy (id = auth.uid()).
 */
export async function updateProfile(patch: {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du må være logget inn." };

  const update: Record<string, string | null> = {};

  if (patch.displayName !== undefined) {
    const name = patch.displayName.trim().slice(0, MAX_NAME);
    if (!name) return { error: "Navnet kan ikke være tomt." };
    update.display_name = name;
  }
  if (patch.bio !== undefined) {
    const bio = patch.bio?.trim().slice(0, MAX_BIO) ?? "";
    update.bio = bio || null;
  }
  if (patch.avatarUrl !== undefined) {
    update.avatar_url = patch.avatarUrl;
  }

  if (Object.keys(update).length === 0) return {};

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return {};
}

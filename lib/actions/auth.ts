"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

/** The origin the user is actually on — see lib/site-url. */
const requestOrigin = getSiteUrl;

export interface AuthActionState {
  error?: string;
  sent?: boolean;
}

/** Send an email magic link (OTP). */
export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) return { error: error.message };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/** Persist the onboarding answer as the user's display name context. */
export async function completeOnboarding(collectingFor: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The answer personalizes empty states; store it on the profile's metadata.
  await supabase.auth.updateUser({
    data: { collecting_for: collectingFor },
  });
  revalidatePath("/library");
  redirect("/library");
}

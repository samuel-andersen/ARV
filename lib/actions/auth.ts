"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * The origin the user is actually on, read from the request — robust to a
 * missing/misconfigured NEXT_PUBLIC_SITE_URL. This is what the magic link
 * redirect must point at so it always lands back on the real domain.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

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

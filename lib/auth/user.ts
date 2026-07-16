import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/schemas/common";

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  plan: Plan;
}

/** Returns the signed-in user + profile, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, plan")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
    bio: (profile as { bio?: string | null } | null)?.bio ?? null,
    plan: (profile?.plan as Plan) ?? "free",
  };
}

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client for Server Components, Server Actions, and Route
 * Handlers. RLS is enforced everywhere, so this always runs as the signed-in
 * user (never the service role).
 *
 * Why the two-step: `auth.getUser()` works from cookies, but supabase-js's
 * internal propagation of the session token to the PostgREST client is
 * timing-fragile inside Server Actions — the `.from()` request can go out with
 * only the anon key, so `auth.uid()` is null and every RLS write ("owner_id =
 * auth.uid()") fails with "new row violates row-level security policy". To make
 * it deterministic we read the token from the cookie session (no network round
 * trip) and forward it explicitly as the Authorization header. We only forward
 * the token — we never trust its claims without `getUser()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const cookieMethods = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Called from a Server Component — safe to ignore; middleware
        // refreshes the session cookie on navigation.
      }
    },
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const base = createServerClient(url, anon, { cookies: cookieMethods });

  const {
    data: { session },
  } = await base.auth.getSession();

  // Not signed in — return the plain (anon) client for public reads.
  if (!session?.access_token) return base;

  // Signed in — pin the user's token onto every PostgREST/Storage request so
  // RLS resolves auth.uid() reliably.
  return createServerClient(url, anon, {
    cookies: cookieMethods,
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });
}

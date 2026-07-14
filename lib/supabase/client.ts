import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components.
 *
 * Left untyped for now: results are shaped into explicit types in the data
 * layer (lib/data/*). Once `npm run db:types` has generated Database types from
 * a live schema, add the `<Database>` generic here to restore end-to-end typing.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

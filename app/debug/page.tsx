import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Ground-truth RLS diagnostic. Visit /debug while signed in and screenshot it.
 * It reports exactly what the database sees for THIS request:
 *  - who getUser() says we are,
 *  - whether a session token is present to forward,
 *  - whether the DB can read our own RLS-protected profile row
 *    (visible ⟺ auth.uid() == our id),
 *  - a live recipes insert attempt (rolled back) with the raw error.
 * Build marker DEBUG-v1 proves the running bundle is current.
 */
export default async function DebugPage() {
  const rows: [string, string][] = [];
  rows.push(["build marker", "DEBUG-v1"]);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  rows.push(["getUser().id", user?.id ?? "— (null)"]);
  rows.push(["getUser().email", user?.email ?? "—"]);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  rows.push(["session present", session ? "yes" : "NO"]);
  rows.push([
    "access_token",
    session?.access_token ? `${session.access_token.slice(0, 12)}… (len ${session.access_token.length})` : "— (none)",
  ]);

  if (user) {
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    rows.push(["profile visible under RLS", prof ? "YES (auth.uid works)" : "NO (auth.uid is null)"]);
    if (profErr) rows.push(["profile read error", profErr.message]);

    // Live insert probe — rolled back immediately.
    const { data: ins, error: insErr } = await supabase
      .from("recipes")
      .insert({
        owner_id: user.id,
        title: "__debug_probe__",
        servings: 1,
        source_platform: "manual",
        is_original: true,
        normalized: true,
      })
      .select("id")
      .single();
    if (insErr) {
      rows.push(["INSERT probe", "FAILED"]);
      rows.push(["INSERT error", insErr.message]);
      rows.push(["INSERT code", insErr.code ?? "—"]);
      rows.push(["INSERT details", insErr.details ?? "—"]);
    } else {
      rows.push(["INSERT probe", "OK ✓ (RLS passes)"]);
      await supabase.from("recipes").delete().eq("id", ins.id);
      rows.push(["cleanup", "probe row deleted"]);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-light text-ink">RLS-diagnose</h1>
      <p className="mt-2 text-sm font-light text-stone">
        Ta et skjermbilde av denne siden og send til meg.
      </p>
      <div className="mt-8 flex flex-col border-t border-line">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:gap-4">
            <span className="w-56 shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
              {k}
            </span>
            <span className="break-all font-mono text-[13px] text-ink">{v}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

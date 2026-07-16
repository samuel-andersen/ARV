import { createClient } from "@/lib/supabase/server";
import { CopyDebug } from "@/components/debug/copy-debug";

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
    // Ground truth: ask the DB what auth.uid()/role it sees for THIS request.
    const { data: who, error: whoErr } = await supabase.rpc("debug_whoami");
    if (whoErr) {
      rows.push(["whoami rpc", `error: ${whoErr.message}`]);
    } else {
      const w = who as { uid: string | null; jwt_sub: string | null; jwt_role: string | null } | null;
      rows.push(["DB auth.uid()", w?.uid ?? "— (NULL)"]);
      rows.push(["DB sees jwt.sub", w?.jwt_sub ?? "— (none)"]);
      rows.push(["DB sees jwt.role", w?.jwt_role ?? "— (none)"]);
      rows.push(["uid matches getUser", w?.uid === user.id ? "YES ✓" : "NO ✗ (mismatch!)"]);
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    rows.push(["profile visible under RLS", prof ? "YES" : "NO"]);
    if (profErr) rows.push(["profile read error", profErr.message]);

    const base = {
      title: "__debug_probe__",
      servings: 1,
      source_platform: "manual",
      is_original: true,
      normalized: true,
    };

    // Probe A — plain INSERT, NO returning. Does not trigger the SELECT policy.
    const { error: errA } = await supabase
      .from("recipes")
      .insert({ owner_id: user.id, ...base, title: "__probeA__" });
    rows.push(["A: insert (no returning)", errA ? `FAILED ${errA.code ?? ""}: ${errA.message}` : "OK ✓"]);

    // If A worked, read back the row to see what owner_id actually got stored.
    if (!errA) {
      const { data: back } = await supabase
        .from("recipes")
        .select("id, owner_id")
        .eq("title", "__probeA__")
        .maybeSingle();
      rows.push(["A: stored owner_id", back?.owner_id ?? "— (null / not readable)"]);
      rows.push(["A: matches your id", back?.owner_id === user.id ? "YES ✓" : "NO ✗"]);
      // Clean up (delete by owner regardless of readback).
      await supabase.from("recipes").delete().eq("title", "__probeA__");
    }

    // Probe B — INSERT ... RETURNING. Also enforces the SELECT (can_read_recipe) policy.
    const { data: insB, error: errB } = await supabase
      .from("recipes")
      .insert({ owner_id: user.id, ...base, title: "__probeB__" })
      .select("id")
      .single();
    if (errB) {
      rows.push(["B: insert + returning", `FAILED ${errB.code ?? ""}: ${errB.message}`]);
    } else {
      rows.push(["B: insert + returning", "OK ✓"]);
      await supabase.from("recipes").delete().eq("id", insB.id);
    }
  }

  const logText =
    "ARV RLS-diagnose\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-light text-ink">RLS-diagnose</h1>
      <p className="mt-2 text-sm font-light text-stone">
        Trykk «Kopier alt» og lim inn til meg.
      </p>
      <div className="mt-5">
        <CopyDebug text={logText} />
      </div>
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

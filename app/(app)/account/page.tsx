import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user";
import { listRecipes } from "@/lib/data/recipes";
import { listBooks } from "@/lib/data/books";
import { getPendingInvites } from "@/lib/data/books";
import { signOut } from "@/lib/actions/auth";

const LABEL = "text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const [recipes, books, invites] = await Promise.all([
    listRecipes(),
    listBooks(),
    user?.email ? getPendingInvites(user.email) : Promise.resolve([]),
  ]);

  const name = user?.displayName ?? "Din profil";
  const initial = (user?.displayName?.trim()[0] ?? user?.email?.trim()[0] ?? "A").toUpperCase();
  const orderedBooks = books.filter((b) => b.status === "ordered" || b.status === "printed").length;

  return (
    <div className="max-w-xl">
      {/* Identity */}
      <div className="flex items-center gap-4 pt-2">
        <span className="serif flex h-14 w-14 shrink-0 items-center justify-center bg-salvie text-[23px] text-gran">
          {initial}
        </span>
        <div>
          <h1 className="serif text-[22px] font-normal text-ink">{name}</h1>
          <p className="mt-1 text-xs font-light text-stone">
            Samler til familien · {user?.plan === "pro" ? "Arv Pro" : "medlem"}
          </p>
        </div>
      </div>

      {/* Key stats — shared-border grid */}
      <div className="mt-6 grid grid-cols-3 gap-px border-y border-line bg-line">
        <Stat n={recipes.length} label="Oppskrifter" />
        <Stat n={books.length} label={books.length === 1 ? "Bok" : "Bøker"} />
        <Stat n={orderedBooks} label="Bestilt" />
      </div>

      {/* Book progress card */}
      {books[0] && (
        <Link
          href={`/books/${books[0].id}`}
          className="tap mt-6 flex items-center justify-between bg-salvie px-4 py-4"
        >
          <div>
            <div className="text-[13px] font-medium text-gran">{books[0].title}</div>
            <div className="mt-0.5 text-[11.5px] font-light text-gran">
              {books[0].recipeCount} {books[0].recipeCount === 1 ? "oppskrift" : "oppskrifter"} plassert
            </div>
          </div>
          <span className="text-[15px] font-light text-gran">→</span>
        </Link>
      )}

      {/* Settings */}
      <p className={`mt-8 ${LABEL}`}>Innstillinger</p>
      <div className="mt-3 flex flex-col border-t border-line">
        <SettingRow href="/invites" label="Invitasjoner" value={invites.length ? `${invites.length} →` : "→"} />
        <SettingRow label="E-post" value={user?.email ?? "—"} />
        <SettingRow
          label="Arv Pro"
          value={user?.plan === "pro" ? "Aktiv →" : "Ubegrenset import →"}
          accent={user?.plan !== "pro"}
        />
      </div>

      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="tap border border-line px-5 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
        >
          Logg ut
        </button>
      </form>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-papir py-4 text-center">
      <div className="serif text-[20px] text-ink tabular-nums">{n}</div>
      <div className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.16em] text-stone">
        {label}
      </div>
    </div>
  );
}

function SettingRow({
  href,
  label,
  value,
  accent,
}: {
  href?: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  const inner = (
    <div className="flex items-center justify-between border-b border-line py-3.5 text-[13.5px]">
      <span className="text-ink">{label}</span>
      <span className={`font-light ${accent ? "text-gran" : "text-stone"}`}>{value}</span>
    </div>
  );
  return href ? (
    <Link href={href} className="tap">
      {inner}
    </Link>
  ) : (
    inner
  );
}

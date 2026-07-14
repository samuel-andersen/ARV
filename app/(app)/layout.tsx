import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { signOut } from "@/lib/actions/auth";

/** Authenticated shell. Quiet chrome — hairline nav, no shadow, one accent. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/library" className="text-sm font-medium tracking-tight text-ink">
            Arv
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/library" className="font-light text-stone hover:text-gran">
              Library
            </Link>
            <Link href="/books" className="font-light text-stone hover:text-gran">
              Books
            </Link>
            <Link
              href="/recipes/new"
              className="font-light text-gran hover:text-ink"
            >
              New recipe
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-gran"
                title={user.email ?? undefined}
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}

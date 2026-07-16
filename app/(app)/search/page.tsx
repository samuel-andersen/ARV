import Link from "next/link";
import { listRecipes } from "@/lib/data/recipes";
import { FeedCard } from "@/components/recipe/recipe-cards";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const recipes = query ? await listRecipes(query) : [];

  return (
    <div>
      <h1 className="serif pt-2 text-[27px] font-light tracking-[-0.01em] text-ink">
        Søk
      </h1>

      <form action="/search" method="get" className="mt-5 flex items-center gap-2.5 border border-line bg-snow px-4 py-3.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="shrink-0 text-stone"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          autoCapitalize="none"
          enterKeyHint="search"
          placeholder="Oppskrift, ingrediens eller @konto"
          className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-ink placeholder:text-stone/70 focus:outline-none"
        />
      </form>

      {query === "" ? (
        <p className="mt-10 text-sm font-light text-stone">
          Skriv for å søke i biblioteket ditt.
        </p>
      ) : recipes.length === 0 ? (
        <div className="mt-10 border border-line bg-snow p-10 text-center">
          <p className="text-sm font-light text-stone">
            Ingen oppskrifter matcher «{query}».
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
            {recipes.length} {recipes.length === 1 ? "treff" : "treff"}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {recipes.map((r) => (
              <li key={r.id}>
                <FeedCard recipe={r} />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-10 text-center text-xs font-light text-stone">
        <Link href="/library" className="text-gran hover:text-ink">
          Tilbake til biblioteket
        </Link>
      </p>
    </div>
  );
}

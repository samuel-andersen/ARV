import Link from "next/link";
import { listRecipes } from "@/lib/data/recipes";
import { getCurrentUser } from "@/lib/auth/user";
import { FeaturedCard } from "@/components/recipe/recipe-cards";
import { LibraryFeed } from "@/components/recipe/library-feed";

/** Time-aware Norwegian greeting. */
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "God morgen";
  if (h >= 10 && h < 17) return "God dag";
  if (h >= 17 && h < 23) return "God kveld";
  return "God natt";
}

function firstName(displayName: string | null, email: string | null): string | null {
  const fromName = displayName?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email?.split("@")[0];
  if (!local) return null;
  const cleaned = local.split(/[._-]/)[0];
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : null;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [recipes, user] = await Promise.all([listRecipes(q), getCurrentUser()]);
  const name = firstName(user?.displayName ?? null, user?.email ?? null);

  const featured = !q ? recipes[0] : undefined;
  const rest = featured ? recipes.slice(1) : recipes;

  return (
    <div>
      {/* Greeting — the serif voice, personal. */}
      <div className="pt-2">
        <h1 className="serif text-[31px] font-light leading-tight tracking-[-0.01em] text-ink">
          {greeting()}
          {name ? `, ${name}.` : "."}
        </h1>
        <p className="mt-2 text-sm font-light text-stone">
          {recipes.length === 0
            ? "Biblioteket ditt er tomt. Hent den første oppskriften du faktisk lager."
            : `${recipes.length} ${recipes.length === 1 ? "oppskrift" : "oppskrifter"} samlet. Boken vokser for hver du legger til.`}
        </p>
      </div>

      {/* Hent-felt — paste a link, hand it to the import agent. */}
      <form action="/import" method="get" className="mt-6 flex">
        <input
          type="url"
          name="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-label="Lim inn en lenke å hente oppskrift fra"
          placeholder="Lim inn lenke — Instagram, TikTok, YouTube"
          className="min-w-0 flex-1 border border-r-0 border-line bg-snow px-4 py-[15px] text-[16px] text-ink placeholder:text-stone/70 focus:border-gran focus:outline-none"
        />
        <button
          type="submit"
          className="tap bg-gran px-6 py-[15px] text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
        >
          Hent
        </button>
      </form>

      {/* Search — quiet, below the fold of the greeting. */}
      <form action="/search" method="get" className="mt-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          enterKeyHint="search"
          aria-label="Søk i biblioteket"
          placeholder="Søk i biblioteket"
          className="w-full border border-line bg-transparent px-4 py-3 text-[16px] text-ink placeholder:text-stone/70 focus:border-gran focus:outline-none"
        />
      </form>

      {recipes.length === 0 ? (
        <div className="mt-10 border border-line bg-snow p-12 text-center">
          <p className="serif-italic text-[15px] font-light leading-relaxed text-gran">
            Oppskriftene du lagrer forsvinner med appene de bor i.
          </p>
          <p className="mt-3 text-sm font-light text-stone">
            {q ? "Ingen oppskrifter matcher søket." : "Lim inn en lenke ovenfor, eller "}
            {!q && (
              <Link href="/recipes/new" className="text-gran hover:text-ink">
                skriv inn en selv
              </Link>
            )}
            {!q && "."}
          </p>
        </div>
      ) : (
        <>
          {featured && (
            <div className="mt-6">
              <FeaturedCard recipe={featured} />
            </div>
          )}

          {rest.length > 0 && <LibraryFeed recipes={rest} />}
        </>
      )}
    </div>
  );
}

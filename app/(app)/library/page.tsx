import Link from "next/link";
import { listRecipes } from "@/lib/data/recipes";
import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const recipes = await listRecipes(q);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>Library</Eyebrow>
          <h1 className="mt-3 text-3xl font-light text-ink">Your recipes</h1>
        </div>
        <Link href="/recipes/new">
          <Button>New recipe</Button>
        </Link>
      </div>

      <form className="mt-8" action="/library">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search recipes"
          className="h-11 w-full max-w-sm rounded-none border border-line bg-snow px-3 text-sm text-ink placeholder:text-fog focus:border-gran focus:outline-none"
        />
      </form>

      {recipes.length === 0 ? (
        <div className="mt-16 border border-line p-12 text-center">
          <p className="font-light text-stone">
            {q
              ? "No recipes match that search."
              : "Nothing here yet. Add the first recipe you actually cook."}
          </p>
          {!q && (
            <div className="mt-6 flex justify-center">
              <Link href="/recipes/new">
                <Button variant="secondary">Add a recipe</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <li key={r.id} className="bg-snow">
              <Link
                href={`/recipes/${r.id}`}
                className="block h-full p-5 transition-colors duration-150 hover:bg-mist"
              >
                <div className="flex items-center gap-2">
                  <Eyebrow>
                    {r.is_original ? "Own" : r.source_platform}
                  </Eyebrow>
                  {!r.normalized && (
                    <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-negative">
                      Needs review
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-light leading-snug text-ink">
                  {r.title}
                </h2>
                {r.description && (
                  <p className="mt-2 line-clamp-2 text-sm font-light text-stone">
                    {r.description}
                  </p>
                )}
                <p className="mt-4 text-xs font-light text-stone">
                  {r.ingredientCount} ingredients · serves {r.servings}
                  {r.source_author ? ` · ${r.source_author}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

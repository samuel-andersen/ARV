import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/data/recipes";
import { deleteRecipe } from "@/lib/actions/recipes";
import { RecipeBody } from "@/components/recipe/recipe-body";
import { ShareToggle } from "@/components/recipe/share-toggle";
import { CookModeLauncher } from "@/components/recipe/cook-mode";
import { Eyebrow } from "@/components/ui/label";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const del = deleteRecipe.bind(null, id);
  const totalMin = (recipe.prep_min ?? 0) + (recipe.cook_min ?? 0);

  return (
    <article className="paper-sheet mx-auto max-w-3xl p-6 sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow>{recipe.is_original ? "Own recipe" : recipe.source_platform}</Eyebrow>
          <h1 className="mt-3 text-4xl font-light leading-tight text-ink">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-3 max-w-2xl font-light text-stone">
              {recipe.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={`/recipes/${id}/edit`}
            className="text-sm font-light text-gran hover:text-ink"
          >
            Edit
          </Link>
          <form action={del}>
            <button
              type="submit"
              className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-negative"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-light text-stone">
        <span>serves {recipe.servings}</span>
        {recipe.prep_min != null && <span>prep {recipe.prep_min} min</span>}
        {recipe.cook_min != null && <span>cook {recipe.cook_min} min</span>}
        {totalMin > 0 && <span>total {totalMin} min</span>}
        {recipe.tags.map((t) => (
          <span key={t} className="text-gran">
            #{t}
          </span>
        ))}
      </div>

      {recipe.story && (
        <blockquote className="mt-8 border-l-2 border-salvie pl-5">
          <p className="max-w-2xl font-light leading-relaxed text-ink">
            {recipe.story}
          </p>
        </blockquote>
      )}

      <div className="mt-8 max-w-xs">
        <CookModeLauncher
          title={recipe.title}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />
      </div>

      <div className="mt-12">
        <RecipeBody
          baseServings={recipe.servings}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />
      </div>

      <div className="mt-12 max-w-xl">
        <ShareToggle
          recipeId={recipe.id}
          initialPublic={recipe.is_public}
          initialSlug={recipe.share_slug}
          siteUrl={SITE_URL}
        />
      </div>

      {/* Attribution — always present for imports. */}
      {!recipe.is_original && (recipe.source_author || recipe.source_url) && (
        <footer className="mt-16 border-t border-line pt-6">
          <Eyebrow>Source</Eyebrow>
          <p className="mt-3 font-light text-stone">
            {recipe.source_author && <span>{recipe.source_author} · </span>}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-gran hover:text-ink"
              >
                {recipe.source_platform}
              </a>
            )}
          </p>
        </footer>
      )}
    </article>
  );
}

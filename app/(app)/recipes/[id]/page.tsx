import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe, getRecipeNotes } from "@/lib/data/recipes";
import { RecipeBody } from "@/components/recipe/recipe-body";
import { ShareToggle } from "@/components/recipe/share-toggle";
import { CookModeLauncher } from "@/components/recipe/cook-mode";
import { BackButton } from "@/components/app/back-button";
import { DeleteRecipeButton } from "@/components/recipe/delete-recipe-button";
import { SourceQr } from "@/components/recipe/source-qr";
import { RecipeActions } from "@/components/recipe/recipe-actions";
import { RecipeNotes } from "@/components/recipe/recipe-notes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const LABEL = "text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone";

function totalTime(prep: number | null, cook: number | null): string | null {
  const total = (prep ?? 0) + (cook ?? 0);
  if (total <= 0) return null;
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} t ${m} min` : `${h} t`;
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();
  const notes = await getRecipeNotes(id);
  const sourceRaw = (recipe as unknown as { source_raw?: string | null }).source_raw ?? null;

  const time = totalTime(recipe.prep_min, recipe.cook_min);
  const credit = recipe.is_original
    ? "Din oppskrift"
    : recipe.source_author
      ? `Etter ${recipe.source_author}`
      : recipe.source_platform;

  return (
    <article className="-mx-5 bg-snow sm:mx-0 sm:border sm:border-line">
      {/* Photo hero with a white back affordance. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-salvie">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="serif text-5xl font-light text-gran/50">Arv</span>
          </div>
        )}
        <BackButton />
      </div>

      <div className="flex flex-col gap-5 px-5 py-6 sm:px-8">
        <div>
          <h1 className="serif text-[30px] font-normal leading-tight text-ink">
            {recipe.title}
          </h1>
          <p className="mt-2 text-[12.5px] font-light text-stone">
            {credit}
            {` · ${recipe.servings} porsjoner`}
            {time ? ` · ${time}` : ""}
          </p>
        </div>

        {recipe.story && (
          <p className="serif-italic border-l-2 border-salvie pl-3.5 text-[14.5px] font-light leading-relaxed text-gran">
            {recipe.story}
          </p>
        )}

        {/* Edit bar — Rediger · Vis originalen · Lag min variant. */}
        <RecipeActions recipeId={recipe.id} sourceRaw={sourceRaw} tags={recipe.tags} />

        <RecipeBody
          baseServings={recipe.servings}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />

        {/* Mine notater — printed in the book's margin. */}
        <RecipeNotes recipeId={recipe.id} notes={notes} />

        {/* Share. */}
        <div className="mt-2">
          <ShareToggle
            recipeId={recipe.id}
            initialPublic={recipe.is_public}
            initialSlug={recipe.share_slug}
            siteUrl={SITE_URL}
          />
        </div>

        {/* Source attribution — always present for imports. */}
        {!recipe.is_original && (recipe.source_author || recipe.source_url) && (
          <div className="border-t border-line pt-5">
            <span className={LABEL}>Kilden</span>
            <p className="mt-2 text-[12.5px] font-light text-stone">
              Arv husker hvor den kom fra.{" "}
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
            {recipe.source_url && (
              <div className="mt-4">
                <SourceQr url={recipe.source_url} />
              </div>
            )}
          </div>
        )}

        {/* Primary actions. */}
        <div className="mt-2 flex gap-2.5">
          <div className="flex-1">
            <CookModeLauncher
              title={recipe.title}
              ingredients={recipe.ingredients}
              steps={recipe.steps}
            />
          </div>
          <Link
            href="/books"
            className="tap flex items-center justify-center border border-line px-4 text-[13px] font-medium text-gran transition-colors hover:border-gran"
          >
            + Boken
          </Link>
        </div>

        <div className="pt-2">
          <DeleteRecipeButton id={recipe.id} />
        </div>
      </div>
    </article>
  );
}

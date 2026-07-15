import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicRecipeBySlug } from "@/lib/data/recipes";
import { RecipeBody } from "@/components/recipe/recipe-body";
import { CookModeLauncher } from "@/components/recipe/cook-mode";
import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);
  if (!recipe) return { title: "Recipe not found" };
  return {
    title: recipe.title,
    description: recipe.description ?? `A recipe shared via Arv.`,
    openGraph: { title: recipe.title, description: recipe.description ?? undefined },
  };
}

export default async function PublicRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);
  if (!recipe) notFound();

  const book = { fontFamily: "var(--font-book)" };

  return (
    <div className="min-h-screen bg-mist px-4 py-8 sm:py-14">
      <main className="paper-sheet mx-auto max-w-3xl p-6 sm:p-12">
      <div className="flex items-center justify-between">
        <Eyebrow>Shared via Arv</Eyebrow>
        <Link
          href="/"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-gran"
        >
          arv.kitchen
        </Link>
      </div>

      <h1 style={book} className="mt-8 text-5xl font-light leading-[1.05] text-ink">
        {recipe.title}
      </h1>
      {recipe.description && (
        <p style={book} className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-stone">
          {recipe.description}
        </p>
      )}

      {recipe.story && (
        <blockquote className="mt-8 border-l-2 border-salvie pl-5">
          <p className="max-w-2xl font-light leading-relaxed text-ink">{recipe.story}</p>
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

      {!recipe.is_original && (recipe.source_author || recipe.source_url) && (
        <footer className="mt-14 border-t border-line pt-6">
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

      {/* Viral loop: every shared recipe is a landing page. */}
      <section className="mt-16 bg-salvie p-8">
        <Eyebrow onSalvie>Keep it for good</Eyebrow>
        <p className="mt-3 max-w-lg font-light text-gran">
          Save this to your own Arv, gather the recipes you love, and turn them
          into a printed hardcover. From scroll to shelf.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button>Save to your Arv</Button>
          </Link>
        </div>
      </section>

      <p className="mt-10 text-center text-[11px] uppercase tracking-[0.22em] text-stone">
        Samlet med Arv · arv.kitchen
      </p>
      </main>
    </div>
  );
}

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
  if (!recipe) return { title: "Oppskrift ikke funnet" };
  return {
    title: recipe.title,
    description: recipe.description ?? "En oppskrift delt via Arv.",
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

  return (
    <div className="min-h-screen bg-papir px-4 py-8 sm:py-14">
      <main className="paper-sheet mx-auto max-w-3xl p-6 sm:p-12">
      <div className="flex items-center justify-between">
        <Eyebrow>Delt via Arv</Eyebrow>
        <Link
          href="/"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-gran"
        >
          arv.kitchen
        </Link>
      </div>

      <h1 className="serif mt-8 text-[40px] font-normal leading-[1.05] text-ink">
        {recipe.title}
      </h1>
      {recipe.description && (
        <p className="serif mt-4 max-w-2xl text-lg font-light leading-relaxed text-stone">
          {recipe.description}
        </p>
      )}

      {recipe.story && (
        <blockquote className="mt-8 border-l-2 border-salvie pl-5">
          <p className="serif-italic max-w-2xl font-light leading-relaxed text-gran">{recipe.story}</p>
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
          <Eyebrow>Kilden</Eyebrow>
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
        <Eyebrow onSalvie>Ta vare på den</Eyebrow>
        <p className="mt-3 max-w-lg font-light text-gran">
          Lagre denne i din egen Arv, samle oppskriftene du er glad i, og gjør dem
          til en trykt, innbundet bok. Fra feed til familiearv.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button>Lagre i din Arv</Button>
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

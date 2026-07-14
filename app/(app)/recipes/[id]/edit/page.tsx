import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/data/recipes";
import { RecipeForm, type RecipeFormInitial } from "@/components/recipe/recipe-form";
import { Eyebrow } from "@/components/ui/label";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const initial: RecipeFormInitial = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description ?? "",
    story: recipe.story ?? "",
    servings: recipe.servings,
    prep_min: recipe.prep_min,
    cook_min: recipe.cook_min,
    ingredients: recipe.ingredients.length
      ? recipe.ingredients.map((ing) => ({
          quantity: ing.quantity?.toString() ?? "",
          unit: ing.unit ?? "",
          name: ing.name,
          note: ing.note ?? "",
        }))
      : [{ quantity: "", unit: "", name: "", note: "" }],
    steps: recipe.steps.length
      ? recipe.steps.map((s) => ({
          text: s.text,
          timer_min: s.timer_seconds ? String(Math.round(s.timer_seconds / 60)) : "",
        }))
      : [{ text: "", timer_min: "" }],
    tags: recipe.tags,
  };

  return (
    <div className="max-w-3xl">
      <Eyebrow>Edit recipe</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">{recipe.title}</h1>
      <div className="mt-10">
        <RecipeForm initial={initial} />
      </div>
    </div>
  );
}

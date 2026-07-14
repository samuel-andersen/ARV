import { RecipeForm } from "@/components/recipe/recipe-form";
import { Eyebrow } from "@/components/ui/label";

export default function NewRecipePage() {
  return (
    <div className="max-w-3xl">
      <Eyebrow>New recipe</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">Write it down.</h1>
      <p className="mt-3 max-w-xl font-light text-stone">
        A recipe you cook yourself. Add the story — the book is meant to be
        written in.
      </p>
      <div className="mt-10">
        <RecipeForm />
      </div>
    </div>
  );
}

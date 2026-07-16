import { RecipeForm } from "@/components/recipe/recipe-form";
import { Eyebrow } from "@/components/ui/label";

export default function NewRecipePage() {
  return (
    <div className="max-w-3xl">
      <Eyebrow>Ny oppskrift</Eyebrow>
      <h1 className="serif mt-3 text-[27px] font-normal text-ink">Skriv den ned.</h1>
      <p className="mt-3 max-w-xl font-light text-stone">
        En oppskrift du lager selv. Legg til historien — boken er ment å skrives i.
      </p>
      <div className="mt-10">
        <RecipeForm />
      </div>
    </div>
  );
}

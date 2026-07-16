import { NewBookForm } from "@/components/book/new-book-form";
import { Eyebrow } from "@/components/ui/label";

export default function NewBookPage() {
  return (
    <div>
      <Eyebrow>Ny bok</Eyebrow>
      <h1 className="serif mt-3 text-[27px] font-normal text-ink">Begynn en bok.</h1>
      <p className="mt-3 max-w-xl font-light text-stone">
        Du tar innholdsvalgene — oppskrifter, rekkefølge, dedikasjon. Arv gjør
        at det ser trykket ut.
      </p>
      <div className="mt-10">
        <NewBookForm />
      </div>
    </div>
  );
}

import { NewBookForm } from "@/components/book/new-book-form";
import { Eyebrow } from "@/components/ui/label";

export default function NewBookPage() {
  return (
    <div>
      <Eyebrow>New book</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">Begin a book.</h1>
      <p className="mt-3 max-w-xl font-light text-stone">
        You make the content decisions — recipes, order, dedication. Arv makes
        it look typeset.
      </p>
      <div className="mt-10">
        <NewBookForm />
      </div>
    </div>
  );
}

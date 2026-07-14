import Link from "next/link";
import { listBooks } from "@/lib/data/books";
import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function BooksPage() {
  const books = await listBooks();

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>Books</Eyebrow>
          <h1 className="mt-3 text-3xl font-light text-ink">Your books</h1>
        </div>
        <Link href="/books/new">
          <Button>New book</Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="mt-16 border border-line p-12 text-center">
          <p className="font-light text-stone">
            No books yet. Gather your recipes into something for the shelf.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/books/new">
              <Button variant="secondary">Begin a book</Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col">
          {books.map((b) => (
            <li key={b.id}>
              <Link
                href={`/books/${b.id}`}
                className="flex items-center justify-between border-b border-line py-5 transition-colors duration-150 hover:bg-mist"
              >
                <div>
                  <h2 className="text-xl font-light text-ink">{b.title}</h2>
                  {b.subtitle && (
                    <p className="mt-1 text-sm font-light text-stone">{b.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-xs font-light text-stone">
                  <span className="capitalize">{b.style}</span>
                  <span>{b.recipeCount} recipes</span>
                  <span className="uppercase tracking-[0.22em]">{b.status}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

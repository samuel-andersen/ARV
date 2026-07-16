import Link from "next/link";
import { listBooks } from "@/lib/data/books";

const STATUS_LABEL: Record<string, string> = {
  draft: "Utkast",
  ordered: "Bestilt",
  printed: "Trykket",
};

export default async function BooksPage() {
  const books = await listBooks();

  return (
    <div>
      <div className="flex items-end justify-between pt-2">
        <div>
          <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
            Boken
          </span>
          <h1 className="serif mt-2 text-[27px] font-light tracking-[-0.01em] text-ink">
            Bøkene dine
          </h1>
        </div>
        <Link
          href="/books/new"
          className="tap bg-gran px-5 py-3 text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
        >
          Ny bok
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="mt-10 border border-line bg-snow p-12 text-center">
          <p className="serif-italic text-[15px] font-light text-gran">
            Boken er selve produktet.
          </p>
          <p className="mt-3 text-sm font-light text-stone">
            Samle oppskriftene dine til noe for hylla.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/books/new"
              className="tap border border-line px-5 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
            >
              Begynn en bok
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col border-t border-line">
          {books.map((b) => (
            <li key={b.id}>
              <Link
                href={`/books/${b.id}`}
                className="tap flex items-center justify-between border-b border-line py-5 transition-colors hover:bg-mist"
              >
                <div>
                  <h2 className="serif text-[19px] font-normal text-ink">{b.title}</h2>
                  {b.subtitle && (
                    <p className="mt-1 text-sm font-light text-stone">{b.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-5 text-[11.5px] font-light text-stone">
                  <span>
                    {b.recipeCount} {b.recipeCount === 1 ? "oppskrift" : "oppskrifter"}
                  </span>
                  <span className="uppercase tracking-[0.22em] text-gran">
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

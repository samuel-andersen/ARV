import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookWithContent } from "@/lib/data/books";
import { getCurrentUser } from "@/lib/auth/user";
import { buildBookPages, estimatePageCount } from "@/lib/book/layout";
import { OrderButton } from "@/components/book/order-button";

/* eslint-disable @next/next/no-img-element */

export default async function BookPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, user] = await Promise.all([getBookWithContent(id), getCurrentUser()]);
  if (!book) notFound();

  const pages = buildBookPages(book, user?.displayName ?? null, user?.avatarUrl ?? null);
  const pageCount = estimatePageCount(pages);
  const ordered = book.status === "ordered";
  const coverImage =
    book.cover_image ??
    book.chapters.flatMap((c) => c.recipes).find((r) => r.recipe.image_url)?.recipe.image_url ??
    null;

  return (
    <div className="-mx-5 sm:mx-0">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-line bg-snow px-5 py-3.5 sm:px-6">
        <Link href={`/books/${id}`} aria-label="Tilbake" className="tap text-lg font-light text-stone">
          ←
        </Link>
        <span className="text-sm text-ink">{ordered ? "Bestilt" : "Trykket bok"}</span>
        <span className="w-5" />
      </div>

      {ordered ? (
        <OrderConfirmation title={book.title} pageCount={pageCount} />
      ) : (
        <>
          {/* The 3D book object on Salvie. */}
          <div className="flex flex-col items-center gap-6 bg-salvie px-6 py-14">
            <div className="rise-in flex items-stretch" style={{ boxShadow: "0 28px 52px -22px rgba(20,20,19,0.35)" }}>
              {/* Gran spine */}
              <div className="flex w-[18px] flex-col items-center justify-between bg-gran py-3">
                <span
                  className="serif text-[8px] tracking-[0.2em] text-snow"
                  style={{ writingMode: "vertical-rl" }}
                >
                  {book.title.toUpperCase()}
                </span>
                <span
                  className="text-[6px] font-medium tracking-[0.3em] text-snow"
                  style={{ writingMode: "vertical-rl" }}
                >
                  ARV
                </span>
              </div>
              {/* Cover */}
              <div className="flex h-[272px] w-[210px] flex-col bg-papir">
                <div className="relative m-4 mb-0 flex-1 overflow-hidden bg-mist">
                  {coverImage ? (
                    <img src={coverImage} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="serif text-3xl font-light text-gran/50">Arv</span>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-5 pt-4">
                  <div className="serif text-[19px] leading-tight text-ink">{book.title}</div>
                  {book.subtitle && (
                    <div className="mt-1.5 text-[9px] font-light text-stone">{book.subtitle}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[13px] font-light text-ink">
                Innbundet i lin · 20 × 25 cm · {pageCount} sider
              </div>
              <div className="serif-italic mt-1.5 text-[12.5px] font-light text-gran">
                Trykket og sydd i Norge. Levert på døren om 7–10 dager.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 border-t border-line bg-snow px-5 py-4 sm:px-6">
            <OrderButton bookId={id} />
            <Link
              href={`/api/books/${id}/pdf`}
              prefetch={false}
              className="tap flex items-center justify-center border border-line px-5 py-[15px] text-[13px] font-medium text-gran transition-colors hover:border-gran"
            >
              PDF
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/** Ordrebekreftelse. */
function OrderConfirmation({ title, pageCount }: { title: string; pageCount: number }) {
  return (
    <div className="flex flex-col gap-6 bg-papir px-6 py-14 sm:px-8">
      <div className="flex h-11 w-11 items-center justify-center bg-salvie text-lg text-gran">✓</div>
      <h1 className="serif text-[29px] font-normal leading-tight text-ink" style={{ textWrap: "pretty" }}>
        Boken er på vei til bindingen.
      </h1>
      <p className="max-w-md font-light leading-relaxed text-stone">
        Vi sier fra når den er sydd, og igjen når den er på døren. Levering om 7–10 dager.
      </p>
      <div className="flex flex-col gap-2.5 border-t border-line pt-5">
        <div className="flex justify-between text-[13px]">
          <span className="text-stone">{title}</span>
          <span>{pageCount} sider · lin</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-stone">Levering</span>
          <span>Posten · hjem</span>
        </div>
      </div>
      <Link
        href="/library"
        className="tap mt-2 self-start border border-line px-5 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
      >
        Tilbake til biblioteket
      </Link>
    </div>
  );
}

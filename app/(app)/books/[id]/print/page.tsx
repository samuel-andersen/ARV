import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookWithContent, getLatestOrder, getBookFamily } from "@/lib/data/books";
import { getCurrentUser } from "@/lib/auth/user";
import { buildBookPages, estimatePageCount } from "@/lib/book/layout";
import { priceForPages, kr } from "@/lib/book/pricing";
import { OrderFlow } from "@/components/book/order-flow";

/* eslint-disable @next/next/no-img-element */

export default async function BookPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, user] = await Promise.all([getBookWithContent(id), getCurrentUser()]);
  if (!book) notFound();

  const family = await getBookFamily(id, book.owner_id);
  const contributorNames = family.filter((m) => m.accepted && !m.isOwner).map((m) => m.name ?? "");
  const pages = buildBookPages(
    book,
    user?.displayName ?? null,
    user?.avatarUrl ?? null,
    contributorNames,
  );
  const pageCount = estimatePageCount(pages);
  const ordered = book.status === "ordered";
  const order = ordered ? await getLatestOrder(id) : null;
  const unitPrice = priceForPages(pageCount);
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
        <OrderConfirmation title={book.title} pageCount={pageCount} order={order} />
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
              <div className="mt-1.5 text-[13px] text-ink">
                Fra <span className="font-medium">{kr(unitPrice)}</span>
              </div>
              <div className="serif-italic mt-1.5 text-[12.5px] font-light text-gran">
                Trykket og sydd i Norge. Levert på døren om 7–10 dager.
              </div>
            </div>
          </div>

          {/* Proof + order */}
          <div className="border-t border-line bg-snow px-5 py-4 sm:px-6">
            <Link
              href={`/api/books/${id}/pdf`}
              prefetch={false}
              className="tap mb-2.5 flex items-center justify-center gap-2 text-[12.5px] font-medium text-gran hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Se korrektur (PDF) — akkurat slik den trykkes
            </Link>
            <div className="flex items-center gap-2.5">
              <OrderFlow bookId={id} pageCount={pageCount} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The fulfillment stages a book moves through after ordering. */
const STAGES: { key: string; label: string; note: string }[] = [
  { key: "submitted", label: "Bestilt", note: "Vi har mottatt bestillingen." },
  { key: "in_production", label: "Trykkes og sys", note: "Sidene trykkes og bindes i lin." },
  { key: "shipped", label: "Sendt", note: "På vei med Posten." },
  { key: "delivered", label: "Levert", note: "Fremme hos deg." },
];

/** Ordrebekreftelse — en kvittering med referanse, tidslinje og detaljer. */
function OrderConfirmation({
  title,
  pageCount,
  order,
}: {
  title: string;
  pageCount: number;
  order: Awaited<ReturnType<typeof getLatestOrder>>;
}) {
  const ref = (order?.id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
  const currentStage = Math.max(
    0,
    STAGES.findIndex((s) => s.key === (order?.status ?? "submitted")),
  );
  const amount = order?.amountCents != null ? kr(Math.round(order.amountCents / 100)) : null;

  return (
    <div className="flex flex-col gap-6 bg-papir px-6 py-12 sm:px-8">
      <div>
        <div className="flex h-11 w-11 items-center justify-center bg-salvie text-lg text-gran">✓</div>
        <h1 className="serif mt-6 text-[29px] font-normal leading-tight text-ink" style={{ textWrap: "pretty" }}>
          Boken er på vei til bindingen.
        </h1>
        <p className="mt-3 max-w-md font-light leading-relaxed text-stone">
          Vi bekrefter på e-post før trykk, og sier fra igjen når den er sendt.
          {ref && (
            <>
              {" "}
              Ordrenr. <span className="text-ink tabular-nums">{ref}</span>.
            </>
          )}
        </p>
      </div>

      {/* Fulfillment timeline */}
      <ol className="flex flex-col border-t border-line pt-5">
        {STAGES.map((s, i) => {
          const done = i <= currentStage;
          return (
            <li key={s.key} className="flex gap-3.5 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className={
                    "flex h-4 w-4 items-center justify-center rounded-full text-[8px] " +
                    (done ? "bg-gran text-snow" : "border border-line bg-snow text-transparent")
                  }
                >
                  ✓
                </span>
                {i < STAGES.length - 1 && (
                  <span className={"mt-0.5 w-px flex-1 " + (i < currentStage ? "bg-gran" : "bg-line")} />
                )}
              </div>
              <div className="-mt-0.5 pb-1">
                <div className={"text-[13.5px] " + (done ? "text-ink" : "text-stone")}>{s.label}</div>
                <div className="mt-0.5 text-[11.5px] font-light text-stone">{s.note}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Receipt */}
      <div className="flex flex-col gap-2.5 border-t border-line pt-5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-stone">{title}</span>
          <span className="text-ink">{pageCount} sider · lin</span>
        </div>
        {order?.copies ? (
          <div className="flex justify-between">
            <span className="text-stone">Eksemplarer</span>
            <span className="text-ink">{order.copies}</span>
          </div>
        ) : null}
        {order?.recipientName && (
          <div className="flex justify-between gap-6">
            <span className="text-stone">Mottaker</span>
            <span className="text-right text-ink">{order.recipientName}</span>
          </div>
        )}
        {amount && (
          <div className="flex justify-between border-t border-line pt-2.5">
            <span className="font-medium text-ink">Totalt</span>
            <span className="serif text-[16px] text-ink tabular-nums">{amount}</span>
          </div>
        )}
      </div>

      <Link
        href="/library"
        className="tap mt-1 self-start border border-line px-5 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
      >
        Tilbake til biblioteket
      </Link>
    </div>
  );
}

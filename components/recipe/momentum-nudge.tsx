import Link from "next/link";

/**
 * Momentum toward the first book (#7). Once a few recipes are gathered, keep
 * the long-term payoff — the printed book — alive with a gentle, specific nudge
 * instead of leaving the book a place users have to remember to visit.
 */
export function MomentumNudge({
  recipeCount,
  hasBook,
  placedCount,
  firstBookId,
}: {
  recipeCount: number;
  hasBook: boolean;
  placedCount: number;
  firstBookId: string | null;
}) {
  // Only nudge once there's enough to matter and there's real slack to close.
  if (recipeCount < 3 || placedCount >= recipeCount) return null;

  const href = hasBook && firstBookId ? `/books/${firstBookId}` : "/books/new";
  const line = hasBook
    ? `Boken din venter — ${placedCount} av ${recipeCount} oppskrifter er lagt inn.`
    : `Du har samlet ${recipeCount} oppskrifter. Nok til å begynne din første bok.`;
  const cta = hasBook ? "Fortsett boken" : "Begynn boken";

  return (
    <Link
      href={href}
      className="tap mt-6 flex items-center justify-between gap-4 bg-salvie px-4 py-4 transition-opacity hover:opacity-90"
    >
      <div>
        <div className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-gran/70">
          Boken vokser
        </div>
        <p className="serif-italic mt-1 text-[14.5px] font-light leading-snug text-gran">{line}</p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-[13px] font-medium text-gran">{cta} →</span>
    </Link>
  );
}

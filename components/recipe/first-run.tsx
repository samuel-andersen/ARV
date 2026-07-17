import Link from "next/link";
import { Paper, PageInner } from "@/components/book/spread-preview";
import { SAMPLE_SPREAD } from "@/lib/book/sample";

const STEPS: { n: string; title: string; body: string }[] = [
  { n: "01", title: "Hent", body: "Lim inn en lenke fra Instagram, TikTok eller YouTube — eller skriv inn en selv. Arv skriver den om til husets stil." },
  { n: "02", title: "Samle", body: "Legg oppskriftene du er glad i i en bok, med kapitler, historier og dine egne bilder." },
  { n: "03", title: "Trykk", body: "Bestill den som en innbundet bok i lin — noe for hylla, å gi videre." },
];

/**
 * First-run payoff. A brand-new library is empty, so instead of a dead end we
 * show where this is going: a real sample spread ("slik blir boka di") and the
 * three steps. The reward is visible before any work is done.
 */
export function FirstRun() {
  return (
    <div className="mt-8 flex flex-col gap-10">
      {/* Payoff — a real book spread. */}
      <section>
        <div className="flex items-baseline justify-between">
          <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
            Slik blir boka di
          </span>
          <span className="text-[11px] font-light text-stone">Eksempel</span>
        </div>

        <div className="mt-3 bg-mist p-5 sm:p-8">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-5">
            {SAMPLE_SPREAD.map((page, i) => (
              <div key={i} style={{ containerType: "inline-size" }}>
                <Paper>
                  <PageInner page={page} />
                </Paper>
              </div>
            ))}
          </div>
          <p className="serif-italic mt-5 text-center text-[13px] font-light text-gran">
            Fra en lenke i farten til en bok du gir videre.
          </p>
        </div>
      </section>

      {/* Three steps. */}
      <section>
        <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
          Slik funker det
        </span>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="border border-line bg-snow p-4">
              <div className="serif text-[17px] font-light text-gran/70">{s.n}</div>
              <h3 className="mt-1.5 text-[14px] font-medium text-ink">{s.title}</h3>
              <p className="mt-1 text-[12.5px] font-light leading-relaxed text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Nudge back to the Hent field above. */}
      <p className="border-t border-line pt-6 text-center text-[13px] font-light text-stone">
        Begynn med å lime inn en lenke øverst — eller{" "}
        <Link href="/recipes/new" className="text-gran hover:text-ink">
          skriv inn den første selv
        </Link>
        .
      </p>
    </div>
  );
}

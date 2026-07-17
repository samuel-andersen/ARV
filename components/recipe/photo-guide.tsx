"use client";

import { useState } from "react";
import { tapHaptic } from "@/lib/haptics";

/* ---- Small schematic diagrams for the three shooting angles. ---- */

function AngleTop() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="36" cy="46" r="16" />
      <circle cx="36" cy="46" r="8" className="opacity-40" />
      <rect x="28" y="8" width="16" height="11" rx="1.5" />
      <path d="M36 19v9" strokeDasharray="2 3" />
      <path d="M33 25l3 3 3-3" />
    </svg>
  );
}
function Angle45() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="40" cy="50" rx="18" ry="7" />
      <path d="M31 50c0-4 18-4 18 0" className="opacity-40" />
      <rect x="8" y="12" width="15" height="11" rx="1.5" transform="rotate(-8 15 17)" />
      <path d="M22 22l14 22" strokeDasharray="2 3" />
      <path d="M32 40l4 4 1-5" />
    </svg>
  );
}
function AngleFront() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M24 52h24" />
      <path d="M30 52c0-10 12-10 12 0" />
      <rect x="8" y="46" width="13" height="10" rx="1.5" />
      <path d="M21 51h8" strokeDasharray="2 3" />
      <path d="M27 48l3 3-3 3" />
    </svg>
  );
}

const ANGLES: { Icon: () => React.ReactElement; title: string; body: string }[] = [
  { Icon: AngleTop, title: "Ovenfra", body: "Flate retter: suppe, bowls, pizza, et dekket bord." },
  { Icon: Angle45, title: "Skrå (45°)", body: "Retter med litt høyde: tallerken med garnityr, en gryte." },
  { Icon: AngleFront, title: "Rett forfra", body: "Høye ting: lagkake, burger, et glass." },
];

const LESSON: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Lyset avgjør alt",
    body: "Sett retten nær et vindu og skru av blitsen. Mykt dagslys fra siden gir dybde og glans; blits og taklys flater maten ut og gir harde skygger. Overskyet vær eller lys gjennom en tynn gardin er perfekt.",
  },
  {
    n: "03",
    title: "Rydd rammen",
    body: "Tørk søl på tallerkenkanten og fjern rot i bakgrunnen. Et rolig underlag — tre, lin eller stein — er alt du trenger. La litt luft rundt maten, så den får puste.",
  },
  {
    n: "04",
    title: "Kom tett på",
    body: "Fyll bildet med maten. Det er detaljene — damp, snittflate, en glinsende saus — som frister. Gå nærmere i stedet for å zoome; digital zoom gir uskarpt bilde.",
  },
  {
    n: "05",
    title: "Hold det skarpt",
    body: "Trykk på maten i søkeren for å fokusere der du vil. Støtt albuen mot bordet eller hold pusten et øyeblikk. Tørk av kameralinsen — den er ofte fettete.",
  },
  {
    n: "06",
    title: "Ta det ferskt",
    body: "Mat er finest de første minuttene, før den synker sammen eller blir kald. Ha kameraet klart før du plaiterer. Et dryss urter eller en skje som løfter gir liv til bildet.",
  },
  {
    n: "07",
    title: "Lett finpuss",
    body: "Løft lysstyrken litt og rett opp horisonten. Hold det naturlig — overmettede farger ser kunstige ut. Mindre er mer.",
  },
];

/**
 * "Slik tar du gode matbilder" — an optional mini-lesson, not just a tip list.
 * Surfaced wherever the user is about to take a photo (photoless recipes, the
 * end of cook mode). Encourages their own hero shot — imports never carry a
 * print-quality image, and your own photo is the whole Arv idea.
 */
export function PhotoGuide({ label = "Slik tar du gode matbilder →" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          setOpen(true);
        }}
        className="tap text-xs font-medium text-gran hover:text-ink"
      >
        {label}
      </button>

      {open && (
        <div
          className="scrim-in fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="sheet-up max-h-[88dvh] w-full max-w-md overflow-y-auto bg-papir px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:max-h-[85vh] sm:border sm:border-line"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
                  Mini-leksjon
                </span>
                <h2 className="serif mt-1.5 text-[24px] font-normal leading-tight text-ink">
                  Gode matbilder
                </h2>
                <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-stone">
                  Tre ting avgjør nesten alt: lyset, vinkelen, og hva som ikke er med.
                  Ditt eget bilde av retten hører til i din bok.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-stone hover:text-ink"
                aria-label="Lukk"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* 01 — Light */}
            <Section n={LESSON[0].n} title={LESSON[0].title} body={LESSON[0].body} />

            {/* 02 — Angle, with diagrams */}
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex gap-3">
                <span className="serif text-[15px] font-light text-gran/70">02</span>
                <div className="flex-1">
                  <h3 className="text-[14px] font-medium text-ink">Velg vinkel etter retten</h3>
                  <p className="mt-1 text-[12.5px] font-light leading-relaxed text-stone">
                    Flat mat tåler å fotograferes rett ovenfra; mat med høyde vil ha en skrå
                    eller rett vinkel så formen kommer fram.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {ANGLES.map((a) => (
                      <div key={a.title} className="bg-salvie p-2.5 text-center">
                        <div className="mx-auto h-12 w-12 text-gran">
                          <a.Icon />
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-ink">{a.title}</div>
                        <div className="mt-0.5 text-[10.5px] font-light leading-snug text-stone">{a.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 03–07 */}
            {LESSON.slice(1).map((s) => (
              <Section key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}

            <p className="serif-italic mt-6 border-t border-line pt-5 text-[12.5px] font-light leading-relaxed text-gran">
              Til trykk: sikt på minst 2000 piksler på lengste kant, så blir også
              helsidebilder skarpe i den ferdige boka.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="mt-6 flex gap-3 border-t border-line pt-5">
      <span className="serif text-[15px] font-light text-gran/70">{n}</span>
      <div>
        <h3 className="text-[14px] font-medium text-ink">{title}</h3>
        <p className="mt-1 text-[12.5px] font-light leading-relaxed text-stone">{body}</p>
      </div>
    </div>
  );
}

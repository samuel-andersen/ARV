"use client";

import { useState } from "react";
import { tapHaptic } from "@/lib/haptics";

const TIPS: { title: string; body: string }[] = [
  {
    title: "Dagslys, aldri blits",
    body: "Sett tallerkenen nær et vindu. Mykt dagslys fra siden gir dybde; blits flater ut maten og gir harde skygger.",
  },
  {
    title: "Rett ovenfra eller i 45°",
    body: "Flate retter (suppe, panner, bord) ovenfra. Retter med høyde (burger, kake, glass) i 45°.",
  },
  {
    title: "Rydd rammen",
    body: "Tørk kanten av tallerkenen, fjern rot i bakgrunnen. Et rent trebord, en duk eller stein er nok.",
  },
  {
    title: "Kom tett på",
    body: "Fyll bildet med maten. Litt luft rundt er fint, men detaljene — damp, tekstur, snittflate — er det som frister.",
  },
  {
    title: "Skarpt og stødig",
    body: "Trykk på maten i søkeren for å fokusere. Hold pusten et øyeblikk, eller støtt albuen mot bordet.",
  },
  {
    title: "Ta det ferskt",
    body: "Mat er finest de første minuttene. Ha kameraet klart før du plaiterer, så det ikke rekker å synke sammen.",
  },
];

/**
 * "Slik tar du gode matbilder" — a lightweight tips sheet. Encourages the user
 * to shoot their own hero photo (imports never carry a print-quality image),
 * which is the whole Arv idea: your version, your kitchen.
 */
export function PhotoGuide() {
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
        Slik tar du gode matbilder →
      </button>

      {open && (
        <div
          className="scrim-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="sheet-up max-h-[85dvh] w-full max-w-md overflow-y-auto bg-papir px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:max-h-[80vh] sm:border sm:border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="serif text-[22px] font-normal leading-tight text-ink">
                  Gode matbilder
                </h2>
                <p className="mt-1 text-[12.5px] font-light text-stone">
                  Ditt eget bilde av retten hører til i din bok.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap -mr-1 -mt-1 flex h-8 w-8 items-center justify-center text-stone hover:text-ink"
                aria-label="Lukk"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <ol className="flex flex-col divide-y divide-line">
              {TIPS.map((t, i) => (
                <li key={t.title} className="flex gap-3.5 py-3.5">
                  <span className="serif mt-0.5 text-[15px] font-light text-gran/70">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-medium text-ink">{t.title}</h3>
                    <p className="mt-1 text-[12.5px] font-light leading-relaxed text-stone">
                      {t.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="serif-italic mt-4 border-t border-line pt-4 text-[12.5px] font-light leading-relaxed text-gran">
              Til trykk: sikt på minst 2000 piksler på lengste kant, så blir også
              helsidebilder skarpe i den ferdige boka.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

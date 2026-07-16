import type { Metadata } from "next";
import { color } from "@/lib/design/tokens";

/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = {
  title: "Grafisk profil",
  description: "Arv visuell profil — logo, farger, typografi, bannere og flater.",
};

const SECTION = "border-t border-line px-5 py-14 sm:px-8 sm:py-20";
const EY = "text-[11px] font-medium uppercase tracking-[0.22em] text-stone";

const PALETTE = [
  { name: "Snow", hex: color.snow, role: "Kort, sider", ring: true },
  { name: "Papir", hex: color.papir, role: "App-canvas", ring: true },
  { name: "Mist", hex: color.mist, role: "Seksjoner", ring: true },
  { name: "Salvie", hex: color.salvie, role: "Identitetsflate", fg: color.gran },
  { name: "Gran", hex: color.gran, role: "Knapper, lenker", fg: "#FFFFFF" },
  { name: "Stone", hex: color.stone, role: "Sekundærtekst", fg: "#FFFFFF" },
  { name: "Ink", hex: color.ink, role: "Tekst, punktum", fg: "#FFFFFF" },
];

const DOWNLOADS: { group: string; items: { label: string; file: string }[] }[] = [
  {
    group: "Logo & ikon",
    items: [
      { label: "Ordmerke — lys", file: "/brand/wordmark-light.png" },
      { label: "Ordmerke — Gran", file: "/brand/wordmark-gran.png" },
      { label: "Ordmerke — Ink", file: "/brand/wordmark-ink.png" },
      { label: "App-ikon — Gran", file: "/brand/icon-gran.png" },
      { label: "App-ikon — Ink", file: "/brand/icon-ink.png" },
      { label: "App-ikon — Salvie", file: "/brand/icon-salvie.png" },
      { label: "Avatar — sirkulær", file: "/brand/avatar-round.png" },
    ],
  },
  {
    group: "Bannere & deling",
    items: [
      { label: "OG / delebilde 1200×630", file: "/brand/og-image.png" },
      { label: "LinkedIn / X 1584×396", file: "/brand/banner-linkedin-1584x396.png" },
      { label: "Kampanje · Salvie 1200×400", file: "/brand/banner-campaign-1200x400.png" },
      { label: "Sitat · Ink 1200×400", file: "/brand/banner-quote-1200x400.png" },
    ],
  },
  {
    group: "Sosiale medier",
    items: [
      { label: "Instagram — utsagn 4:5", file: "/brand/ig-post-statement.png" },
      { label: "Instagram — sitat 4:5", file: "/brand/ig-post-quote.png" },
      { label: "Instagram — Ink 4:5", file: "/brand/ig-post-ink.png" },
      { label: "Story 9:16", file: "/brand/ig-story.png" },
    ],
  },
  {
    group: "Bok",
    items: [
      { label: "Bokrygg — Gran", file: "/brand/spine-gran.png" },
      { label: "Bokrygg — Ink", file: "/brand/spine-ink.png" },
      { label: "Bokrygg — Salvie", file: "/brand/spine-salvie.png" },
    ],
  },
];

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-[1100px] bg-papir">
      {/* Hero */}
      <header className="px-5 pb-14 pt-16 sm:px-8 sm:pt-24">
        <div className={EY}>Visuell profil · v2.0 · 2026</div>
        <h1 className="mt-3 text-[clamp(34px,7vw,56px)] font-light leading-[1.05] tracking-[-0.025em] text-ink">
          Arv — hele pakka.
        </h1>
        <p className="serif-italic mt-4 text-[16px] font-light text-gran">
          Fra feed til familiearv. Logo, farger, typografi, bannere og flater.
        </p>
      </header>

      {/* Logo */}
      <section className={SECTION}>
        <div className={EY}>01 · Logo og ordmerke</div>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          <Lockup bg="bg-snow">
            <span className="text-[clamp(40px,9vw,60px)] font-medium tracking-[0.30em] text-ink [margin-right:-0.3em]">
              ARV
            </span>
            <span className="mt-5 block text-xs font-light text-stone">
              Primær · Inter 500 · sperring .30em
            </span>
          </Lockup>
          <Lockup bg="bg-gran">
            <span className="text-[clamp(40px,9vw,60px)] font-medium tracking-[0.30em] text-snow [margin-right:-0.3em]">
              ARV
            </span>
            <span className="mt-5 block text-xs font-light text-salvie">På Gran · alltid ren hvit</span>
          </Lockup>
        </div>
        {/* Icon variants */}
        <div className="mt-px grid grid-cols-2 gap-px border border-t-0 border-line bg-line sm:grid-cols-4">
          <IconCell label="App-ikon · iOS" src="/brand/icon-gran.png" />
          <IconCell label="Mørk variant" src="/brand/icon-ink.png" />
          <IconCell label="Lys variant" src="/brand/icon-salvie.png" />
          <IconCell label="Avatar" src="/brand/avatar-round.png" />
        </div>
      </section>

      {/* Colors */}
      <section className={SECTION}>
        <div className={EY}>02 · Farger — én grønn tone, faste roller</div>
        <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
          {PALETTE.map((c) => (
            <div
              key={c.name}
              className="flex h-32 flex-col justify-end p-3"
              style={{ background: c.hex, boxShadow: c.ring ? "inset 0 0 0 1px " + color.line : undefined }}
            >
              <span className="text-[13px]" style={{ color: c.fg ?? color.ink }}>
                {c.name}
              </span>
              <span className="text-[11px] font-light" style={{ color: c.fg ?? color.stone }}>
                {c.hex.toUpperCase()}
              </span>
              <span className="mt-0.5 text-[10px] font-light" style={{ color: c.fg ?? color.stone }}>
                {c.role}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-[760px] text-[13px] font-light leading-relaxed text-stone">
          Én farge — grønn. Gran er den eneste interaktive fargen. Salvie er identitetsflaten: bånd,
          brikker, paneler — aldri knapper. Tekst på Salvie er alltid Gran eller Ink. Hairlines i Line.
        </p>
      </section>

      {/* Type */}
      <section className={SECTION}>
        <div className={EY}>03 · Typografi — to stemmer</div>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          <div className="bg-snow p-8 sm:p-11">
            <div className={EY}>Inter · chrome og budskap</div>
            <div className="mt-5 text-[clamp(28px,5vw,40px)] font-light leading-[1.1] tracking-[-0.025em]">
              Fra feed til familiearv.
            </div>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-stone">
              Brødtekst i 400. Ledetekster i 300. Knapper og etiketter i 500 — aldri fet, aldri kursiv.
            </p>
          </div>
          <div className="bg-snow p-8 sm:p-11">
            <div className={EY}>Source Serif · der maten bor</div>
            <div className="serif mt-5 text-[clamp(26px,5vw,34px)] font-medium leading-[1.15]">
              Kardemommeboller
            </div>
            <p className="serif-italic mt-4 text-[16px] font-light leading-relaxed text-gran">
              Kursiv til historier, notater og alt som skal kjennes håndskrevet.
            </p>
          </div>
        </div>
      </section>

      {/* Banners */}
      <section className={SECTION}>
        <div className={EY}>04 · Bannere</div>
        <div className="mt-6 flex flex-col gap-8">
          <Asset label="LinkedIn / X · 1584 × 396" src="/brand/banner-linkedin-1584x396.png" ratio="1584/396" />
          <Asset label="Kampanje · Salvie · 1200 × 400" src="/brand/banner-campaign-1200x400.png" ratio="1200/400" />
          <Asset label="Sitat · Ink · 1200 × 400" src="/brand/banner-quote-1200x400.png" ratio="1200/400" />
        </div>
      </section>

      {/* Social */}
      <section className={SECTION}>
        <div className={EY}>05 · Sosiale medier</div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Asset label="Utsagn 4:5" src="/brand/ig-post-statement.png" ratio="4/5" bare />
          <Asset label="Sitat 4:5" src="/brand/ig-post-quote.png" ratio="4/5" bare />
          <Asset label="Ink 4:5" src="/brand/ig-post-ink.png" ratio="4/5" bare />
        </div>
        <div className="mt-6 max-w-[220px]">
          <Asset label="Story 9:16" src="/brand/ig-story.png" ratio="9/16" bare />
        </div>
      </section>

      {/* Book spines */}
      <section className={SECTION}>
        <div className={EY}>06 · Bokrygger</div>
        <div className="mt-6 flex flex-wrap items-end gap-4">
          {["gran", "ink", "salvie"].map((s) => (
            <img
              key={s}
              src={`/brand/spine-${s}.png`}
              alt={`Bokrygg ${s}`}
              className="h-64 w-auto"
              loading="lazy"
            />
          ))}
          <p className="max-w-[240px] pb-2 text-[13px] font-light leading-relaxed text-stone">
            ARV-kolofonen står nederst på ryggen — liten, aldri høylytt på kundens objekt.
          </p>
        </div>
      </section>

      {/* Downloads */}
      <section className={SECTION}>
        <div className={EY}>Last ned</div>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {DOWNLOADS.map((g) => (
            <div key={g.group}>
              <div className="text-[13px] font-medium text-ink">{g.group}</div>
              <ul className="mt-3 flex flex-col border-t border-line">
                {g.items.map((it) => (
                  <li key={it.file}>
                    <a
                      href={it.file}
                      download
                      className="flex items-center justify-between border-b border-line py-2.5 text-[13.5px] font-light text-ink transition-colors hover:text-gran"
                    >
                      <span>{it.label}</span>
                      <span className="text-gran">↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer punctuation */}
      <div className="flex flex-wrap items-center justify-between gap-5 bg-ink px-5 py-12 sm:px-8">
        <span className="serif-italic text-[clamp(18px,4vw,22px)] font-light text-snow">
          Vi bygger for hylla, ikke for feeden.
        </span>
        <span className="text-[13px] font-medium tracking-[0.34em] text-snow [margin-right:-0.34em]">
          ARV
        </span>
      </div>
    </main>
  );
}

function Lockup({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className={`${bg} flex flex-col items-start justify-center px-8 py-14 sm:px-12`}>
      <div>{children}</div>
    </div>
  );
}

function IconCell({ label, src }: { label: string; src: string }) {
  return (
    <div className="flex flex-col items-center gap-3 bg-snow p-8">
      <img src={src} alt={label} className="h-20 w-20" loading="lazy" />
      <span className="text-center text-[11.5px] font-light text-stone">{label}</span>
    </div>
  );
}

function Asset({
  label,
  src,
  ratio,
  bare,
}: {
  label: string;
  src: string;
  ratio: string;
  bare?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-light text-stone">{label}</div>
      <div
        className={bare ? "overflow-hidden" : "overflow-hidden border border-line"}
        style={{ aspectRatio: ratio }}
      >
        <img src={src} alt={label} className="h-full w-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}

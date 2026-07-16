import Link from "next/link";
import { LandingEffects } from "@/components/landing/landing-effects";
import { SafeImage } from "@/components/landing/safe-image";

/* eslint-disable @next/next/no-img-element */

/**
 * Arv landing — "Fra feed til familiearv." Rebuilt to the design handoff v3.
 * Food photos are Unsplash placeholders (per the handoff) — swap for owned
 * photography before launch.
 */

const label = "text-[11px] font-medium uppercase tracking-[0.22em]";
const h2 =
  "font-light tracking-[-0.02em] leading-[1.12] text-ink [font-size:clamp(30px,3.6vw,46px)]";

const PROCESS = [
  {
    n: "1",
    t: "Del",
    p: "Del en oppskrift til Arv rett fra Instagram, TikTok eller YouTube. Appen ser videoen, lytter til instruksjonene og skriver alt ned — ingredienser, mengder og steg. Kilden krediteres alltid.",
  },
  {
    n: "2",
    t: "Samle",
    p: "Rett mengdene etter din smak, skriv notater i margen og ordne kapitler. Lag mat med kokkemodus — ett steg om gangen, laget for melete fingre. Originalen bevares alltid.",
  },
  {
    n: "3",
    t: "Trykk",
    p: "Når boken er klar, trykkes den i 20 × 25 cm, innbundet i lin, sydd og levert hjem. Med tomme skrivelinjer i margen — arven skal fortsette med blyant.",
  },
];

const QUOTES = [
  { q: "Jeg hadde 340 lagrede oppskrifter på Instagram. Nå har jeg én bok på kjøkkenbenken.", who: "Ingrid, 34" },
  { q: "Mormors oppskrifter og TikTok-favorittene mine, side om side. Det er rart hvor riktig det føles.", who: "Sofie, 27" },
  { q: "Vi ga svigermor boken til jul. Hun gråt. Så laget hun kanelbollene fra side 12.", who: "Marte, 41" },
];

const SPECS = [
  { v: "20 × 25 cm", d: "stående, innbundet i lin" },
  { v: "50–200 sider", d: "sydd rygg, matt papir" },
  { v: "Fra 799 kr", d: "trykket og levert i Norge" },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-papir text-ink">
      <LandingEffects />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-[clamp(20px,5vw,60px)]">
        {/* Nav */}
        <nav
          id="arv-nav"
          className="sticky top-0 z-50 -mx-3 flex items-center justify-between border-b border-line px-3 py-[22px] backdrop-blur-[14px] transition-[background,box-shadow] duration-300"
          style={{ background: "rgba(251,250,248,0)" }}
        >
          <span className={`${label} !tracking-[0.34em] text-sm`}>ARV</span>
          <div className="flex items-center gap-6 sm:gap-7">
            <a href="#hvordan" className="hidden text-sm font-normal text-ink hover:text-gran sm:inline">
              Slik fungerer det
            </a>
            <a href="#boken" className="hidden text-sm font-normal text-ink hover:text-gran sm:inline">
              Boken
            </a>
            <Link
              href="/login"
              className="tap bg-gran px-6 py-3 text-sm font-medium text-snow transition-opacity hover:opacity-85"
            >
              Last ned gratis
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="g2 grid items-center gap-[clamp(40px,5vw,72px)] py-[clamp(64px,8vw,110px)] md:grid-cols-[1fr_1.15fr]">
          <div className="settle-in">
            <div className={`${label} mb-6 text-stone`}>Arv — norsk for arv · arv.kitchen</div>
            <h1 className="mb-6 font-light leading-[1.08] tracking-[-0.025em] text-ink [font-size:clamp(40px,5.2vw,64px)] [text-wrap:pretty]">
              Fra feed til familiearv.
            </h1>
            <p className="serif-italic mb-3.5 max-w-[440px] text-[18px] font-light leading-[1.65] text-gran">
              Oppskriftene du lagrer forsvinner med appene de bor i.
            </p>
            <p className="mb-9 max-w-[440px] text-[16px] font-light leading-[1.65] text-stone">
              Arv skriver dem ned mens de finnes — og gjør dem til en innbundet bok med familiens
              navn på ryggen.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/login"
                className="tap bg-gran px-[34px] py-4 text-[15px] font-medium text-snow transition-opacity hover:opacity-85"
              >
                Last ned gratis
              </Link>
              <a
                href="#hvordan"
                className="border-b border-gran pb-0.5 text-sm font-medium text-gran hover:border-ink hover:text-ink"
              >
                Se hvordan det fungerer
              </a>
            </div>
            <div className="mt-[22px] text-[13px] font-light text-stone">
              Gratis å samle og bygge boken. Du betaler først når den skal trykkes.
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex flex-col items-center">
            <PhoneMock />
            <div className="serif-italic mt-4 text-[13px] font-light text-stone">
              Appen der samlingen bor — boken kommer lenger ned.
            </div>
          </div>
        </header>
      </div>

      {/* Prosessen */}
      <section id="hvordan" className="border-t border-line bg-snow px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto max-w-[1240px]">
          <div data-reveal className={`${label} mb-4 text-stone`}>Prosessen</div>
          <h2 data-reveal className={`${h2} mb-3.5`} style={{ transitionDelay: ".08s" }}>
            Slik fungerer det
          </h2>
          <p data-reveal className="mb-12 max-w-[480px] text-[16px] font-light text-stone" style={{ transitionDelay: ".14s" }}>
            Tre steg fra feeden til hylla. De to første er gratis — boken er kjøpet.
          </p>
          <div
            data-reveal
            className="grid gap-px border border-line bg-line md:grid-cols-3"
            style={{ transitionDelay: ".2s" }}
          >
            {PROCESS.map((s) => (
              <div key={s.n} className="bg-snow px-8 pb-11 pt-9">
                <span className="mb-[22px] inline-flex h-9 w-9 items-center justify-center bg-salvie text-sm font-medium text-gran">
                  {s.n}
                </span>
                <div className="mb-3 text-[19px] tracking-[-0.01em]">{s.t}</div>
                <p className="text-[15px] font-normal leading-[1.65] text-stone">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appen — flip card */}
      <section className="bg-mist px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto grid max-w-[1240px] items-center gap-[clamp(40px,5vw,72px)] md:grid-cols-[1fr_1.2fr]">
          <div data-reveal>
            <div className={`${label} mb-4 text-stone`}>Appen</div>
            <h2 className={`${h2} mb-5 [text-wrap:pretty]`}>Bla i samlingen som om den alt var en bok.</h2>
            <p className="mb-7 text-[16px] font-light leading-[1.7] text-stone">
              Hvert kort i feeden blar om som en bokside: foto foran, ingredienser og fremgangsmåte
              bak. Kategorier for fisk, kjøtt, kaker og brød holder samlingen ryddig mens den vokser.
            </p>
            <div className="flex flex-col border-t border-line">
              {[
                "Kokkemodus: ett steg om gangen, med timere",
                "Egne notater og varianter — originalen bevares",
                "Lesemodus: bla side for side i boken din, før den trykkes",
              ].map((f) => (
                <div key={f} className="flex gap-4 border-b border-line py-[15px] text-[15px]">
                  <span className="min-w-5 font-medium text-gran">—</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <FlipCard />
          </div>
        </div>
      </section>

      {/* Boken — spread */}
      <section id="boken" className="bg-snow px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto max-w-[1240px]">
          <div data-reveal className="mx-auto mb-12 max-w-[640px] text-center">
            <div className={`${label} mb-4 text-stone`}>Boken</div>
            <h2 className={`${h2} mb-4 [text-wrap:pretty]`}>Boken er selve produktet.</h2>
            <p className="text-[16px] font-light leading-[1.7] text-stone">
              20 × 25 cm, innbundet i lin, trykket på tykt matt papir. Hver importert oppskrift
              krediterer skaperen sin — med en liten QR-kode tilbake til originalvideoen.
            </p>
          </div>
          <div
            data-reveal
            className="book-spread mx-auto grid aspect-[8/5] max-w-[960px] grid-cols-2"
            style={{ transitionDelay: ".12s", boxShadow: "0 44px 80px -32px rgba(20,20,19,.3)" }}
          >
            <BookLeftPage />
            <BookRightPage />
          </div>
          <div
            data-reveal
            className="mt-10 flex flex-wrap justify-center gap-[clamp(24px,4vw,56px)]"
            style={{ transitionDelay: ".24s" }}
          >
            {SPECS.map((s) => (
              <div key={s.v} className="text-center">
                <div className="serif text-[20px]">{s.v}</div>
                <div className="mt-1 text-[12.5px] font-light text-stone">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hvorfor nå — Salvie band */}
      <section className="bg-salvie px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto grid max-w-[1240px] items-center gap-[clamp(40px,5vw,72px)] md:grid-cols-[1fr_1.2fr]">
          <div data-reveal>
            <div className={`${label} mb-4 text-gran`}>Hvorfor nå</div>
            <h2 className={`${h2} mb-5 [text-wrap:pretty]`}>Lagret er ikke det samme som bevart.</h2>
            <p className="mb-6 text-[16px] font-normal leading-[1.7] text-gran">
              Kontoer blir private. Videoer slettes. Algoritmen glemmer. Arv henter oppskriftene ut
              mens de finnes — og krediterer alltid den som laget dem.
            </p>
            <Link
              href="/login"
              className="border-b border-gran pb-0.5 text-sm font-medium text-gran hover:border-ink hover:text-ink"
            >
              Begynn å samle gratis
            </Link>
          </div>
          <div data-reveal className="grid grid-cols-3 gap-3" style={{ transitionDelay: ".15s" }}>
            {[
              { src: "photo-1509440159596-0249088772ff", mt: "mt-6" },
              { src: "photo-1529042410759-befb1204b468", mt: "" },
              { src: "photo-1467003909585-2f8a72700288", mt: "mt-12" },
            ].map((im) => (
              <div key={im.src} className={`relative aspect-[4/5] overflow-hidden bg-salvie ${im.mt}`}>
                <SafeImage src={`https://images.unsplash.com/${im.src}?w=500&q=60`} alt="" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sitater */}
      <section className="bg-snow px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto max-w-[1240px]">
          <div data-reveal className={`${label} mb-10 text-stone`}>Fra kjøkkenbenkene</div>
          <div data-reveal className="grid gap-[clamp(32px,4vw,56px)] md:grid-cols-3" style={{ transitionDelay: ".12s" }}>
            {QUOTES.map((c) => (
              <div key={c.who} className="border-t border-line pt-6">
                <p className="serif mb-5 text-[20px] font-light leading-[1.55] [text-wrap:pretty]">
                  «{c.q}»
                </p>
                <div className="text-[13.5px] font-normal text-gran">{c.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gaven */}
      <section className="bg-mist px-5 py-[clamp(64px,8vw,110px)] sm:px-[clamp(20px,5vw,60px)]">
        <div data-reveal className="mx-auto max-w-[840px] text-center">
          <div className={`${label} mb-4 text-stone`}>Gaven</div>
          <h2 className="mb-4 font-light leading-[1.15] tracking-[-0.02em] text-ink [font-size:clamp(28px,3.4vw,42px)] [text-wrap:balance]">
            Den fineste gaven til mamma.
          </h2>
          <p className="mx-auto mb-8 max-w-[560px] text-[16px] font-light leading-[1.7] text-stone">
            Til bryllupet, til jubileet, til mora som har alt. Familien samler oppskriftene sammen i
            appen — én bestiller boken.
          </p>
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-salvie">
            <SafeImage src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=65" alt="Boken som gave" label="Vårt familiebord" labelClassName="serif text-3xl font-light text-gran/50" />
          </div>
        </div>
      </section>

      {/* CTA — Ink */}
      <section id="lastned" className="bg-ink px-5 py-[clamp(80px,10vw,130px)] text-center sm:px-[clamp(20px,5vw,60px)]">
        <h2
          data-reveal
          className="mb-4 font-light leading-[1.15] tracking-[-0.02em] text-snow [font-size:clamp(30px,4vw,50px)] [text-wrap:balance]"
        >
          Begynn på arven i dag.
        </h2>
        <p className="mb-9 text-[16px] font-light text-[#C9C9C7]">
          Gratis å laste ned. Gratis å samle. Boken kommer når dere er klare.
        </p>
        <Link
          href="/login"
          className="tap inline-flex items-center gap-3 border border-[#C9C9C7] px-7 py-3.5 text-snow hover:border-snow"
        >
          <svg width="20" height="24" viewBox="0 0 20 24" fill="#FFFFFF" aria-hidden="true">
            <path d="M16.4 12.7c0-3 2.4-4.4 2.5-4.5-1.4-2-3.5-2.3-4.3-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1.1-3.8-1-2 0-3.8 1.1-4.8 2.9-2 3.6-.5 8.8 1.5 11.7 1 1.4 2.1 3 3.6 2.9 1.5-.1 2-.9 3.8-.9s2.3.9 3.8.9c1.6 0 2.6-1.4 3.6-2.8 1.1-1.6 1.6-3.2 1.6-3.3-.1 0-3.1-1.2-3.1-4.7zM13.4 3.9c.8-1 1.4-2.4 1.2-3.9-1.2.1-2.7.8-3.5 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.6-1.7z" />
          </svg>
          <span className="text-left">
            <span className="block text-[11px] font-light text-[#C9C9C7]">Last ned fra</span>
            <span className="block text-[16px] font-medium">App Store</span>
          </span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-papir px-5 py-8 sm:px-[clamp(20px,5vw,60px)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4">
          <span className={`${label} !tracking-[0.34em] text-[13px]`}>ARV</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/brand" className="text-[13px] font-light text-stone hover:text-gran">
              Grafisk profil
            </Link>
            <span className="text-[13px] font-light text-stone">
              arv.kitchen — Laget i Norge — © 2026
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- Hero phone mockup ---------- */
function PhoneMock() {
  return (
    <div
      id="hero-phone"
      className="settle-in w-[min(310px,76vw)] rounded-[44px] bg-ink p-2.5"
      style={{ boxShadow: "0 44px 80px -36px rgba(20,20,19,.4)", willChange: "transform" }}
    >
      <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[35px] bg-papir">
        <div className="flex justify-center pb-1 pt-2.5">
          <span className="h-[22px] w-[84px] rounded-xl bg-ink" />
        </div>
        <div className="flex items-center justify-between px-[18px] pt-2">
          <span className="text-[10px] font-medium tracking-[0.34em]">ARV</span>
          <span className="flex h-6 w-6 items-center justify-center bg-salvie text-[10px] font-medium text-gran">
            S
          </span>
        </div>
        <div className="px-[18px] pb-3 pt-3.5">
          <div className="serif text-[21px] font-light leading-[1.15]">God kveld, Sofie.</div>
          <div className="mt-1 text-[10px] font-light text-stone">
            Boken din er 38 sider. Tolv igjen til trykk.
          </div>
        </div>
        <div className="mx-[18px] mb-3 flex">
          <span className="flex-1 truncate border border-r-0 border-line bg-snow px-2.5 py-2.5 text-[9px] font-light text-stone">
            Lim inn lenke — Instagram, TikTok…
          </span>
          <span className="bg-gran px-3 py-2.5 text-[9.5px] font-medium text-snow">Hent</span>
        </div>
        <div className="flex gap-1.5 overflow-hidden px-[18px] pb-3">
          <span className="bg-gran px-2.5 py-1.5 text-[8.5px] font-medium text-snow">Alle</span>
          {["Fisk", "Kjøtt", "Kaker", "Brød"].map((c) => (
            <span key={c} className="border border-line bg-snow px-2.5 py-1.5 text-[8.5px] text-gran">
              {c}
            </span>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-[18px]">
          <div className="flex flex-col border border-line bg-snow">
            <div className="relative aspect-[16/10] overflow-hidden bg-salvie">
              <SafeImage src="https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=700&q=65" alt="Kardemommeboller" labelClassName="serif text-sm font-light text-gran/50" />
              <span className={`${label} absolute left-2 top-2 bg-snow px-2 py-1 !text-[7px] !tracking-[0.16em] text-gran`}>
                Kaker
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="serif text-[13px]">Kardemommeboller</div>
                <div className="mt-0.5 text-[8px] font-light text-stone">
                  @sofieskitchen · Instagram · 2 t 30 min
                </div>
              </div>
              <span className="text-right text-[8px] font-light leading-[1.4] text-stone">
                Trykk for
                <br />å bla om
              </span>
            </div>
          </div>
        </div>
        {/* Floating nav preview */}
        <div className="nav-float absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[15px] px-4 py-[7px]">
          {[
            "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z",
          ].map((d) => (
            <svg key={d} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#49604F" strokeWidth="1.6">
              <path d={d} />
            </svg>
          ))}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F6F6C" strokeWidth="1.6">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <span
            className="-mt-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gran"
            style={{ boxShadow: "0 8px 16px -6px rgba(73,96,79,.5)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.6">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F6F6C" strokeWidth="1.6">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
          </svg>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F6F6C" strokeWidth="1.6">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- App section flip card ---------- */
function FlipCard() {
  return (
    <div data-reveal className="flipwrap w-[min(320px,80vw)]" style={{ transitionDelay: ".15s" }}>
      <div className="flipin relative aspect-[4/5.3]">
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden border border-line bg-snow [backface-visibility:hidden]"
          style={{ boxShadow: "0 28px 56px -28px rgba(20,20,19,.28)" }}
        >
          <div className="relative flex-1 overflow-hidden bg-salvie">
            <SafeImage src="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&q=65" alt="Fiskesuppe fra Bergen" label="Fiskesuppe" labelClassName="serif text-lg font-light text-gran/50" />
            <span className={`${label} absolute left-3 top-3 bg-snow px-2.5 py-1.5 !text-[9px] !tracking-[0.18em] text-gran`}>
              Fisk
            </span>
          </div>
          <div className="flex items-center justify-between px-[17px] py-[15px]">
            <div>
              <div className="serif text-[19px]">Fiskesuppe fra Bergen</div>
              <div className="mt-1 text-[11.5px] font-light text-stone">Din oppskrift · 45 min</div>
            </div>
            <span className="text-right text-[11px] font-light leading-[1.4] text-stone">
              Hold for å
              <br />
              bla om
            </span>
          </div>
        </div>
        {/* Back */}
        <div
          className="serif absolute inset-0 flex flex-col overflow-hidden border border-line bg-papir p-[22px] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ boxShadow: "inset 6px 0 14px -10px rgba(20,20,19,.18)" }}
        >
          <div className="text-[18px] leading-tight">Fiskesuppe fra Bergen</div>
          <div className="mt-0.5 text-[9px] font-light not-italic [font-family:var(--font-sans)] text-stone">
            4 porsjoner · 45 min
          </div>
          <div className={`${label} mb-1 mt-2.5 !text-[8px] !tracking-[0.16em] text-stone`}>
            Ingredienser
          </div>
          {[
            ["Torskefilet", "400 g"],
            ["Laks", "200 g"],
            ["Fløte", "3 dl"],
            ["Purre", "1 stk"],
            ["Gulrot", "2 stk"],
            ["Fiskekraft", "1 l"],
          ].map(([n, a]) => (
            <div key={n} className="flex justify-between border-b border-line py-[2.5px] text-[10.5px]">
              <span>{n}</span>
              <span className="text-stone">{a}</span>
            </div>
          ))}
          <div className={`${label} mb-1 mt-2.5 !text-[8px] !tracking-[0.16em] text-stone`}>
            Fremgangsmåte
          </div>
          <div className="flex flex-col gap-1 text-[10.5px] leading-[1.4]">
            <div className="flex gap-1.5">
              <span className="italic text-gran">1</span>
              <span>Fres purre og gulrot blankt i smør.</span>
            </div>
            <div className="flex gap-1.5">
              <span className="italic text-gran">2</span>
              <span>Hell på kraften, la småkoke ti minutter.</span>
            </div>
            <div className="flex gap-1.5">
              <span className="italic text-gran">3</span>
              <span>Ha i fløte og fisk i terninger; trekk til fisken er gjennom.</span>
            </div>
          </div>
          <div className="mt-auto flex justify-between border-t border-line pt-2">
            <span className={`${label} !text-[7.5px] !tracking-[0.12em] text-stone`}>Din oppskrift</span>
            <span className="text-[11px] font-medium not-italic [font-family:var(--font-sans)] text-gran">Åpne oppskriften →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Book spread pages ---------- */
function BookLeftPage() {
  return (
    <div className="serif flex flex-col border border-r-0 border-line bg-snow px-[8%] pb-[5%] pt-[7.5%]">
      <div className={`${label} mb-[18px] text-center !text-[9.5px] text-stone`}>Brød &amp; boller</div>
      <div className="relative flex-1 overflow-hidden bg-salvie">
        <SafeImage src="https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900&q=70" alt="Kardemommeboller" labelClassName="serif text-2xl font-light text-gran/50" />
      </div>
      <div className="mt-5 text-center">
        <div className="font-medium [font-size:clamp(17px,2vw,25px)]">Kardemommeboller</div>
        <div className="serif-italic mt-1.5 text-[12px] font-light text-stone">
          Gir 16 boller · 2 timer 30 minutter
        </div>
      </div>
      <div className="mt-auto pt-3 text-center text-[10px] text-stone">14</div>
    </div>
  );
}

function BookRightPage() {
  return (
    <div className="serif flex flex-col border border-line bg-snow px-[8%] pb-[5%] pt-[7.5%]">
      <div className="flex min-h-0 flex-1 gap-[7%]">
        <div className="flex w-2/5 flex-none flex-col">
          <div className={`${label} mb-1.5 !text-[8.5px] !tracking-[0.2em] text-stone`}>Ingredienser</div>
          {[
            "500 ml helmelk",
            "50 g fersk gjær",
            "150 g smør",
            "1 dl sukker",
            "1 ss malt kardemomme",
            "1 egg",
            "ca. 850 g hvetemel",
            "½ ts salt",
          ].map((i) => (
            <div key={i} className="border-b border-line py-[2px] text-[9.5px]">
              {i}
            </div>
          ))}
          <div className="mt-auto border-t border-line pt-2">
            <div className="serif-italic text-[9.5px] font-light leading-[1.55] text-gran">
              Hev heller en time — de blir luftigere.
            </div>
            <div className={`${label} mt-1 !text-[7px] !tracking-[0.1em] text-stone`}>— Sofie, juni 2026</div>
            <div className="mt-3 h-px bg-line" />
            <div className="mt-3 h-px bg-line" />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`${label} mb-1.5 !text-[8.5px] !tracking-[0.2em] text-stone`}>Fremgangsmåte</div>
          <div className="flex flex-col gap-[5px]">
            {[
              "Varm melken til kroppstemperatur og løs opp gjæren.",
              "Smelt smøret, rør inn sukker, kardemomme og egg.",
              "Elt inn mel og salt til en blank, smidig deig.",
              "La heve under klede til dobbel størrelse, ca. 45 min.",
              "Trill boller og etterhev 30 minutter.",
              "Pensle med egg, stek ved 220° i 10–12 min.",
            ].map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[10px] font-medium text-gran">{i + 1}</span>
                <span className="text-[10px] leading-[1.5]">{s}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-line pt-2.5">
            <QrGlyph />
            <div className="min-w-0">
              <div className={`${label} !text-[7.5px] !tracking-[0.14em] text-stone`}>
                Etter @sofieskitchen · Instagram
              </div>
              <div className="serif-italic mt-0.5 text-[7px] text-stone">
                Skann for å se originalvideoen
              </div>
            </div>
            <span className="ml-auto text-[10px] text-stone">15</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Decorative QR glyph (real QR generation replaces this in print). */
function QrGlyph() {
  const cells = [
    1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1,
  ];
  return (
    <div
      className="flex-none"
      style={{ display: "grid", gridTemplateColumns: "repeat(5,3px)", gridAutoRows: "3px", gap: "1px" }}
    >
      {cells.map((c, i) => (
        <span key={i} style={{ background: c ? "#141413" : "#E2E2E0" }} />
      ))}
    </div>
  );
}

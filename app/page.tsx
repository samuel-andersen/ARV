import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { color } from "@/lib/design/tokens";

/**
 * Foundation landing. This is intentionally quiet — it exists to prove the
 * Arv Design System is wired (tokens, type scale, hairlines, the single
 * interactive color) before any feature surface is built on top.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <Eyebrow>Arv · arv.kitchen</Eyebrow>

      <h1 className="mt-6 text-5xl font-light leading-[1.05] tracking-tight text-ink">
        From scroll to shelf.
      </h1>

      <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-stone">
        A source-to-print system for recipe books — personal and permanent.
        Capture recipes from social media and your own kitchen, and turn the
        collection into a professionally printed hardcover.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <Button>Start collecting</Button>
        <Button variant="secondary">See a book</Button>
      </div>

      {/* Design-system proof band. */}
      <section className="mt-20 border-t border-line pt-10">
        <Eyebrow>Design system v1.0</Eyebrow>
        <div className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {(
            [
              ["Snow", color.snow],
              ["Mist", color.mist],
              ["Salvie", color.salvie],
              ["Gran", color.gran],
              ["Stone", color.stone],
              ["Ink", color.ink],
              ["Fog", color.fog],
              ["Line", color.line],
            ] as const
          ).map(([name, hex]) => (
            <div key={name} className="bg-snow p-4">
              <div
                className="h-16 w-full border border-line"
                style={{ backgroundColor: hex }}
              />
              <p className="mt-3 text-sm font-light text-ink">{name}</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone">
                {hex}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Salvie band — accent surface, Gran text (Stone would fail contrast). */}
      <section className="on-salvie mt-10 bg-salvie p-8">
        <Eyebrow onSalvie>Del gleden</Eyebrow>
        <p className="mt-3 max-w-lg font-light text-gran">
          Everything digital disappears. Arv builds for the shelf, not the feed.
        </p>
      </section>

      <footer className="mt-16 border-t border-line pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone">
          Samlet med Arv · arv.kitchen
        </p>
      </footer>
    </main>
  );
}

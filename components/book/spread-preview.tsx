import type { PageModel } from "@/lib/book/layout";
import { pageCaption, creditLine } from "@/lib/book/labels";
import { ingredientLine, metaLine } from "@/lib/book/format";

const sans = { fontFamily: "var(--font-sans)" } as const;
const LABEL = "text-[clamp(4.5px,1.05cqw,7.5px)] font-medium uppercase tracking-[0.14em] text-gran";

/** Running folio, positioned in the page's foot margin (relative to Paper). */
function Folio({ n, dark }: { n?: number; dark?: boolean }) {
  if (!n) return null;
  return (
    <div
      style={book}
      className={`absolute inset-x-0 bottom-[4%] text-center text-[clamp(5px,1.2cqw,9px)] ${dark ? "text-white/90" : "text-stone"}`}
    >
      {n}
    </div>
  );
}

/**
 * Page-accurate preview of the Editorial style. Paper-white pages on the Mist
 * canvas, each at the 20×25 trim ratio, carrying the product's ONLY permitted
 * soft shadow (it belongs to the paper object, not the UI). Book surfaces use
 * the serif — the deliberate quiet-app / rich-book contrast.
 */

const book = { fontFamily: "var(--font-book)" } as const;

export function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-white"
      style={{ boxShadow: "0 12px 32px -12px rgba(20,20,19,0.22)" }}
    >
      {children}
    </div>
  );
}

function RecipePageInner({ page }: { page: Extract<PageModel, { kind: "recipe" }> }) {
  const { recipe, template, attribution } = page;
  const isFull = template === "full_bleed_photo" && !!recipe.image_url;
  const showPhoto = template === "photo_and_recipe" && !!recipe.image_url;
  const credit =
    attribution && (attribution.author || attribution.url)
      ? `Etter ${attribution.author ?? attribution.platform}`
      : null;

  // Cinematic full-bleed hero: photo + gradient scrim + white text at the foot.
  if (isFull) {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${recipe.image_url})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(20,20,19,0) 40%, rgba(20,20,19,0.78) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-[9%]">
          <span style={sans} className="text-[clamp(4.5px,1.1cqw,8px)] font-medium uppercase tracking-[0.24em] text-white/85">Oppskrift</span>
          <h3 style={book} className="mt-[2%] text-[clamp(15px,3.8cqw,34px)] font-light leading-tight text-white">{recipe.title}</h3>
          <span style={sans} className="mt-[2.5%] text-[clamp(4px,0.95cqw,7.5px)] font-medium uppercase tracking-[0.14em] text-white/85">
            {metaLine(recipe.servings, recipe.prep_min, recipe.cook_min)}
          </span>
          {credit && <span style={book} className="mt-[1%] text-[clamp(4.5px,1.1cqw,8px)] text-white/80">{credit}</span>}
        </div>
        <Folio n={page.folio} dark />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-[7%]">
      <div>
        <h3 style={book} className="text-[clamp(14px,3.4cqw,26px)] font-normal leading-tight text-ink">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p style={book} className="mt-1 text-[clamp(7px,1.7cqw,11px)] leading-snug text-stone">
            {recipe.description}
          </p>
        )}
        <p style={sans} className="mt-[3%] text-[clamp(4.5px,1.05cqw,7.5px)] font-medium uppercase tracking-[0.12em] text-gran">
          {metaLine(recipe.servings, recipe.prep_min, recipe.cook_min)}
        </p>
      </div>

      <div className="mt-[4%] border-t border-line" />
      <div className="mt-[5%] grid flex-1 grid-cols-[35%_1fr] gap-[7%] overflow-hidden">
        <div>
          {showPhoto && (
            <div
              className="mb-[10%] aspect-square w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${recipe.image_url})` }}
            />
          )}
          <p style={sans} className={`mb-[8%] ${LABEL}`}>Ingredienser</p>
          <ul className="flex flex-col gap-[4%]">
            {recipe.ingredients.slice(0, 14).map((ing) => (
              <li key={ing.id} style={book} className="text-[clamp(6px,1.5cqw,9px)] leading-snug text-ink">
                {ingredientLine(ing.quantity, ing.unit, ing.name, ing.note)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p style={sans} className={`mb-[8%] ${LABEL}`}>Fremgangsmåte</p>
          <ol className="flex flex-col gap-[4%]">
            {recipe.steps.slice(0, 8).map((s, i) => (
              <li key={s.id} style={book} className="flex gap-[4%] text-[clamp(6px,1.5cqw,9px)] leading-snug text-ink">
                <span style={sans} className="shrink-0 text-gran">{i + 1}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {credit && (
        <p style={book} className="mt-[3%] text-[clamp(5px,1.2cqw,8px)] text-stone">{credit}</p>
      )}

      <Folio n={page.folio} />
    </div>
  );
}

export function PageInner({ page }: { page: PageModel }) {
  switch (page.kind) {
    case "cover":
      return (
        <div className="relative h-full bg-[#E3EAE4]">
          <div className="absolute inset-[6%] border" style={{ borderColor: "#AEC0B2" }} />
          <div className="relative flex h-full flex-col items-center justify-between p-[14%] text-center">
            <p style={sans} className="text-[clamp(6px,1.5cqw,11px)] font-medium uppercase tracking-[0.5em] text-gran">Arv</p>
            <div className="flex flex-col items-center">
              <h2 style={book} className="text-[clamp(18px,5cqw,44px)] font-light leading-tight tracking-[-0.01em] text-ink">
                {page.title}
              </h2>
              <div className="my-[5%] w-[42px] border-t border-gran" />
              {page.subtitle && (
                <p style={book} className="text-[clamp(8px,2cqw,14px)] text-gran">{page.subtitle}</p>
              )}
            </div>
            <div className="flex flex-col items-center gap-[4%]">
              <div className="w-[18px] border-t border-gran" />
              {page.author && (
                <p style={sans} className="text-[clamp(5px,1.2cqw,8.5px)] uppercase tracking-[0.2em] text-stone">
                  Samlet av {page.author}
                </p>
              )}
              <p style={sans} className="text-[clamp(4px,1cqw,7px)] uppercase tracking-[0.2em] text-stone">
                Innbundet i lin · Trykket i Norge
              </p>
            </div>
          </div>
        </div>
      );
    case "title":
      return (
        <div className="flex h-full flex-col items-center justify-between bg-white p-[14%] text-center">
          <p style={sans} className="text-[clamp(6px,1.4cqw,9px)] font-medium uppercase tracking-[0.4em] text-gran">Arv</p>
          <div className="flex flex-col items-center">
            <h2 style={book} className="text-[clamp(16px,4.6cqw,40px)] font-light leading-tight tracking-[-0.01em] text-ink">
              {page.title}
            </h2>
            <div className="my-[5%] w-[42px] border-t border-gran" />
            {page.subtitle && (
              <p style={book} className="text-[clamp(7px,1.9cqw,13px)] text-gran">{page.subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-[3%]">
            {page.author && (
              <p style={sans} className="text-[clamp(5px,1.2cqw,8.5px)] uppercase tracking-[0.2em] text-stone">
                Samlet av {page.author}
              </p>
            )}
            <p style={book} className="text-[clamp(5px,1.3cqw,10px)] text-stone">arv.kitchen</p>
          </div>
        </div>
      );
    case "dedication":
      return (
        <div className="flex h-full items-center justify-center p-[12%]">
          <p style={book} className="text-center text-[clamp(9px,2.2cqw,16px)] leading-relaxed text-ink">
            {page.text}
          </p>
        </div>
      );
    case "toc":
      return (
        <div className="h-full p-[8%]">
          <p style={sans} className="text-[clamp(6px,1.4cqw,10px)] font-medium uppercase tracking-[0.22em] text-stone">Innhold</p>
          <div className="mt-[7%] flex flex-col gap-[5%]">
            {page.entries.map((e, i) => (
              <div key={i}>
                <div className="flex items-end gap-[3%]">
                  <span style={book} className="text-[clamp(8px,2cqw,13px)] text-ink">{e.chapter}</span>
                  <span className="mb-[3px] flex-1 border-b border-dotted border-line" />
                  <span style={book} className="text-[clamp(8px,2cqw,13px)] tabular-nums text-ink">{e.page}</span>
                </div>
                {e.recipes.map((r, j) => (
                  <div key={j} className="ml-[6%] mt-[2%] flex items-end gap-[3%]">
                    <span style={book} className="text-[clamp(6px,1.4cqw,9px)] text-stone">{r.title}</span>
                    <span className="mb-[2px] flex-1 border-b border-dotted border-line" />
                    <span style={book} className="text-[clamp(6px,1.4cqw,9px)] tabular-nums text-stone">{r.page}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <Folio n={page.folio} />
        </div>
      );
    case "chapter_opener":
      return (
        <div className="flex h-full flex-col items-center justify-center p-[10%] text-center">
          <span style={book} className="text-[clamp(40px,15cqw,84px)] font-light leading-none tracking-[-0.02em] text-gran">
            {page.index}
          </span>
          <span style={sans} className="mt-[2%] text-[clamp(5px,1.3cqw,8px)] font-medium uppercase tracking-[0.28em] text-stone">
            Kapittel
          </span>
          <div className="my-[5%] w-[42px] border-t border-gran" />
          <h2 style={book} className="text-[clamp(16px,4cqw,34px)] font-light tracking-[-0.01em] text-ink">{page.title}</h2>
          {page.introText && (
            <p style={book} className="mt-[4%] max-w-[70%] text-[clamp(7px,1.7cqw,12px)] leading-relaxed text-stone">
              {page.introText}
            </p>
          )}
          <Folio n={page.folio} />
        </div>
      );
    case "recipe":
      return <RecipePageInner page={page} />;
    case "index":
      return (
        <div className="h-full p-[8%]">
          <p style={sans} className="text-[clamp(6px,1.4cqw,10px)] font-medium uppercase tracking-[0.22em] text-stone">Register</p>
          <div className="mt-[7%] columns-2 gap-[6%]">
            {page.entries.map((e) => (
              <p key={e.name} style={book} className="mb-[3%] text-[clamp(6px,1.4cqw,9px)] leading-snug text-ink">
                {e.name} <span className="tabular-nums text-stone">{e.pages.join(", ")}</span>
              </p>
            ))}
          </div>
          <Folio n={page.folio} />
        </div>
      );
    case "colophon":
      return (
        <div className="flex h-full flex-col items-center justify-end gap-[4%] p-[10%] text-center">
          <p style={sans} className="mb-[4%] text-[clamp(6px,1.4cqw,10px)] font-medium uppercase tracking-[0.4em] text-gran">Arv</p>
          {(page.author || page.contributors.length > 0) && (
            <p style={book} className="text-[clamp(7px,1.7cqw,12px)] font-light leading-relaxed text-gran">
              {creditLine(page.author, page.contributors)}
            </p>
          )}
          <p className="text-[clamp(5px,1.2cqw,9px)] uppercase tracking-[0.22em] text-stone">
            Samlet med Arv · arv.kitchen
          </p>
        </div>
      );
  }
}

export function SpreadPreview({ pages }: { pages: PageModel[] }) {
  return (
    <div className="bg-mist p-6">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {pages.map((page, i) => (
          <div key={i} style={{ containerType: "inline-size" }}>
            <Paper>
              <PageInner page={page} />
            </Paper>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.22em] text-stone">
              {pageCaption(page)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

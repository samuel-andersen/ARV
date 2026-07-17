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

  return (
    <div className="flex h-full flex-col p-[7%]">
      {isFull ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image_url})` }}
        />
      ) : null}

      <div className={isFull ? "relative z-10 mt-auto bg-white/85 p-[5%]" : ""}>
        <h3 style={book} className="text-[clamp(14px,3.4cqw,26px)] font-normal leading-tight text-ink">
          {recipe.title}
        </h3>
        {recipe.description && !isFull && (
          <p style={book} className="mt-1 text-[clamp(7px,1.7cqw,11px)] leading-snug text-stone">
            {recipe.description}
          </p>
        )}
        {!isFull && (
          <p style={sans} className="mt-[3%] text-[clamp(4.5px,1.05cqw,7.5px)] font-medium uppercase tracking-[0.12em] text-gran">
            {metaLine(recipe.servings, recipe.prep_min, recipe.cook_min)}
          </p>
        )}
        {isFull && credit && (
          <p style={book} className="mt-1 text-[clamp(5px,1.2cqw,8px)] text-stone">{credit}</p>
        )}
      </div>

      {!isFull && (
        <>
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
        </>
      )}

      {!isFull && credit && (
        <p style={book} className="mt-[3%] text-[clamp(5px,1.2cqw,8px)] text-stone">{credit}</p>
      )}

      <Folio n={page.folio} dark={isFull} />
    </div>
  );
}

export function PageInner({ page }: { page: PageModel }) {
  switch (page.kind) {
    case "cover":
      return (
        <div className="flex h-full flex-col justify-center bg-[#E3EAE4] p-[8%] text-center">
          <p className="text-[clamp(6px,1.5cqw,10px)] uppercase tracking-[0.22em] text-gran">Arv</p>
          <h2 style={book} className="mt-auto text-[clamp(18px,5cqw,40px)] font-light leading-tight text-ink">
            {page.title}
          </h2>
          {page.subtitle && (
            <p style={book} className="mt-2 text-[clamp(8px,2cqw,14px)] text-gran">{page.subtitle}</p>
          )}
          <div className="mt-auto flex flex-col items-center gap-[3%]">
            {page.authorAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.authorAvatar}
                alt=""
                className="h-[16%] max-h-16 w-auto max-w-[24%] object-cover"
                style={{ aspectRatio: "1 / 1" }}
                decoding="async"
              />
            )}
            {page.author && (
              <p className="text-[clamp(6px,1.4cqw,10px)] font-light text-stone">
                Samlet av {page.author}
              </p>
            )}
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
        <div className="flex h-full flex-col justify-center p-[10%]">
          <p style={sans} className="text-[clamp(6px,1.4cqw,10px)] font-medium uppercase tracking-[0.22em] text-gran">
            Kapittel {page.index}
          </p>
          <h2 style={book} className="mt-2 text-[clamp(16px,4cqw,32px)] font-light text-ink">{page.title}</h2>
          {page.introText && (
            <p style={book} className="mt-3 max-w-[80%] text-[clamp(7px,1.7cqw,12px)] leading-relaxed text-stone">
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

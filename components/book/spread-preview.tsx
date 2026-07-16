import type { PageModel } from "@/lib/book/layout";

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
  const showPhoto = template !== "text_only_recipe" && !!recipe.image_url;

  return (
    <div className="flex h-full flex-col p-[6%]">
      {template === "full_bleed_photo" && recipe.image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image_url})` }}
        />
      ) : null}

      <div className={template === "full_bleed_photo" ? "relative z-10 mt-auto bg-white/85 p-[5%]" : ""}>
        <h3 style={book} className="text-[clamp(14px,3.4cqw,26px)] font-normal leading-tight text-ink">
          {recipe.title}
        </h3>
        {recipe.description && template !== "full_bleed_photo" && (
          <p style={book} className="mt-1 text-[clamp(7px,1.7cqw,11px)] text-stone">
            {recipe.description}
          </p>
        )}
      </div>

      {template !== "full_bleed_photo" && (
        <div className="mt-[4%] grid flex-1 grid-cols-[38%_1fr] gap-[5%] overflow-hidden">
          <div>
            {showPhoto && (
              <div
                className="mb-[8%] aspect-square w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${recipe.image_url})` }}
              />
            )}
            <ul className="flex flex-col gap-[3%]">
              {recipe.ingredients.slice(0, 12).map((ing) => (
                <li key={ing.id} style={book} className="text-[clamp(6px,1.5cqw,9px)] leading-snug text-ink">
                  {ing.quantity != null ? `${ing.quantity} ${ing.unit ?? ""} ` : ""}
                  {ing.name}
                </li>
              ))}
            </ul>
          </div>
          <ol className="flex flex-col gap-[3%]">
            {recipe.steps.slice(0, 8).map((s, i) => (
              <li key={s.id} style={book} className="text-[clamp(6px,1.5cqw,9px)] leading-snug text-ink">
                <span className="text-stone">{i + 1}. </span>
                {s.text}
              </li>
            ))}
          </ol>
        </div>
      )}

      {attribution && (attribution.author || attribution.url) && (
        <p style={book} className="mt-[3%] text-[clamp(5px,1.2cqw,8px)] text-stone">
          Etter {attribution.author ?? attribution.platform}
        </p>
      )}
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
          <p className="text-[clamp(6px,1.4cqw,10px)] uppercase tracking-[0.22em] text-stone">Innhold</p>
          <div className="mt-[6%] flex flex-col gap-[3%]">
            {page.entries.map((e, i) => (
              <div key={i}>
                <p style={book} className="text-[clamp(8px,2cqw,13px)] text-ink">{e.chapter}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "chapter_opener":
      return (
        <div className="flex h-full flex-col justify-center p-[10%]">
          <p className="text-[clamp(6px,1.4cqw,10px)] uppercase tracking-[0.22em] text-gran">
            Kapittel {page.index}
          </p>
          <h2 style={book} className="mt-2 text-[clamp(16px,4cqw,32px)] font-light text-ink">{page.title}</h2>
          {page.introText && (
            <p style={book} className="mt-3 max-w-[80%] text-[clamp(7px,1.7cqw,12px)] leading-relaxed text-stone">
              {page.introText}
            </p>
          )}
        </div>
      );
    case "recipe":
      return <RecipePageInner page={page} />;
    case "index":
      return (
        <div className="h-full p-[8%]">
          <p className="text-[clamp(6px,1.4cqw,10px)] uppercase tracking-[0.22em] text-stone">Register</p>
          <div className="mt-[6%] columns-2 gap-[6%]">
            {page.entries.map((e) => (
              <p key={e} style={book} className="text-[clamp(6px,1.4cqw,9px)] leading-snug text-ink">{e}</p>
            ))}
          </div>
        </div>
      );
    case "colophon":
      return (
        <div className="flex h-full items-end justify-center p-[10%]">
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
              {page.kind === "recipe" ? page.template.replace(/_/g, " ") : page.kind}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

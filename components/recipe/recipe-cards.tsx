import Link from "next/link";
import type { RecipeListItem } from "@/lib/data/recipes";

function sourceLine(r: RecipeListItem): string {
  const who = r.is_original
    ? "Din oppskrift"
    : r.source_author
      ? `Etter ${r.source_author}`
      : r.source_platform;
  return `${who} · ${r.ingredientCount} ingredienser`;
}

/** Warm placeholder when a recipe has no photo yet — never a clinical gray box. */
export function PhotoFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-salvie">
      <span className="serif text-3xl font-light text-gran/60">Arv</span>
    </div>
  );
}

/** The featured "Kveldens forslag" — full-width photo, generous. */
export function FeaturedCard({
  recipe,
  eyebrow,
}: {
  recipe: RecipeListItem;
  eyebrow?: string;
}) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="tap block border border-line bg-snow transition-colors hover:border-gran"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <PhotoFallback />
        )}
      </div>
      <div className="px-5 pb-5 pt-4">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gran">
          {eyebrow ?? (recipe.is_original ? "Fra ditt kjøkken" : "Sist hentet")}
        </span>
        <h2 className="serif mt-2 text-[21px] font-normal leading-snug text-ink">
          {recipe.title}
        </h2>
        <p className="mt-1.5 text-xs font-light text-stone">{sourceLine(recipe)}</p>
      </div>
    </Link>
  );
}

/** A feed card — photo front, serif title. */
export function FeedCard({ recipe }: { recipe: RecipeListItem }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="tap flex h-full flex-col border border-line bg-snow transition-colors hover:border-gran"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-mist">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <PhotoFallback />
        )}
        <span className="absolute left-3 top-3 bg-snow px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gran">
          {recipe.is_original ? "Egen" : recipe.source_platform}
        </span>
        {!recipe.normalized && (
          <span className="absolute right-3 top-3 bg-snow px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-negative">
            Se over
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <h3 className="serif text-[17px] font-normal leading-snug text-ink">
          {recipe.title}
        </h3>
        <p className="mt-auto pt-2 text-[11.5px] font-light text-stone">
          {recipe.is_original
            ? "Din oppskrift"
            : (recipe.source_author ?? recipe.source_platform)}
        </p>
      </div>
    </Link>
  );
}

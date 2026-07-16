"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/label";
import { SpreadPreview } from "@/components/book/spread-preview";
import { BookReader } from "@/components/book/book-reader";
import type { BookWithContent, Contributor } from "@/lib/data/books";
import type { RecipeListItem } from "@/lib/data/recipes";
import type { PageModel } from "@/lib/book/layout";
import { deriveSignals, validTemplatesFor } from "@/lib/book/template-selection";
import { STYLE_LABEL, TEMPLATE_LABEL } from "@/lib/book/labels";
import type { PageTemplate } from "@/lib/schemas/common";
import {
  addChapter,
  addRecipeToChapter,
  deleteChapter,
  inviteContributor,
  moveRecipe,
  removeContributor,
  removeRecipeFromChapter,
  setTemplateOverride,
  updateBook,
} from "@/lib/actions/books";
import { cn } from "@/lib/utils";

export function BookBuilder({
  book,
  availableRecipes,
  pages,
  pageCount,
  isOwner,
  currentUserId,
  contributors,
}: {
  book: BookWithContent;
  availableRecipes: RecipeListItem[];
  pages: PageModel[];
  pageCount: number;
  isOwner: boolean;
  currentUserId: string | null;
  contributors: Contributor[];
}) {
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(true);
  const [reading, setReading] = useState(false);
  const [newChapter, setNewChapter] = useState("");
  const [details, setDetails] = useState({
    title: book.title,
    subtitle: book.subtitle ?? "",
    dedication: book.dedication ?? "",
  });

  const run = (fn: () => Promise<unknown>) => startTransition(() => void fn());

  const placedIds = new Set(
    book.chapters.flatMap((ch) => ch.recipes.map((p) => p.recipe.id)),
  );
  const belowMin = pageCount < 24;
  const aboveMax = pageCount > 200;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow>{isOwner ? `Bokbygger · ${STYLE_LABEL[book.style as keyof typeof STYLE_LABEL] ?? book.style}` : "Bidrar til"}</Eyebrow>
          <h1 className="serif mt-3 text-[27px] font-normal text-ink">{book.title}</h1>
          {book.subtitle && <p className="mt-1 font-light text-stone">{book.subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setReading(true)}
            className="text-sm font-light text-gran hover:text-ink"
          >
            Les boken
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((s) => !s)}
            className="hidden text-sm font-light text-gran hover:text-ink sm:inline"
          >
            {showPreview ? "Skjul forhåndsvisning" : "Vis forhåndsvisning"}
          </button>
          <Link href={`/books/${book.id}/print`}>
            <Button>Gjør klar for trykk</Button>
          </Link>
        </div>
      </div>

      {reading && (
        <BookReader pages={pages} title={book.title} onClose={() => setReading(false)} />
      )}

      {/* Preflight line */}
      <div
        className={cn(
          "border-l-2 px-4 py-2 text-sm font-light",
          belowMin || aboveMax ? "border-negative text-negative" : "border-salvie text-stone",
        )}
      >
        {belowMin
          ? `Anslått ${pageCount} sider — en innbundet bok trenger minst 24. Legg til flere oppskrifter.`
          : aboveMax
            ? `Anslått ${pageCount} sider — over maksimum på 200. Del opp boken.`
            : `Anslått ${pageCount} sider · format ${book.trim_size} cm · mål 300 DPI`}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: structure editor */}
        <div className="flex flex-col gap-8">
          {/* Details — owner only */}
          {isOwner && (
          <section className="border border-line p-5">
            <Eyebrow>Omslag og dedikasjon</Eyebrow>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
                placeholder="Tittel"
              />
              <Input
                value={details.subtitle}
                onChange={(e) => setDetails((d) => ({ ...d, subtitle: e.target.value }))}
                placeholder="Undertittel"
              />
              <Textarea
                rows={2}
                value={details.dedication}
                onChange={(e) => setDetails((d) => ({ ...d, dedication: e.target.value }))}
                placeholder="Dedikasjon"
              />
              <div>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      updateBook(book.id, {
                        title: details.title.trim() || book.title,
                        subtitle: details.subtitle.trim() || null,
                        dedication: details.dedication.trim() || null,
                      }),
                    )
                  }
                >
                  Lagre detaljer
                </Button>
              </div>
            </div>
          </section>
          )}

          {/* Contributors — owner only (sharing v1) */}
          {isOwner && (
            <ContributorsPanel bookId={book.id} contributors={contributors} disabled={pending} run={run} />
          )}

          {/* Chapters */}
          {book.chapters.map((ch) => (
            <section key={ch.id} className="border border-line p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light text-ink">{ch.title}</h2>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => run(() => deleteChapter(book.id, ch.id))}
                    className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-negative"
                  >
                    Fjern kapittel
                  </button>
                )}
              </div>

              <ul className="mt-4 flex flex-col">
                {ch.recipes.map((p, i) => {
                  const valid = validTemplatesFor(deriveSignals(p.recipe));
                  const canEdit = isOwner || p.recipe.owner_id === currentUserId;
                  return (
                    <li
                      key={p.recipe.id}
                      className="flex items-center gap-3 border-b border-line py-3"
                    >
                      {isOwner ? (
                        <div className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => run(() => moveRecipe(book.id, ch.id, p.recipe.id, "up"))}
                            className="tap flex h-6 w-9 items-center justify-center text-xs text-stone hover:text-gran disabled:text-fog"
                            aria-label="Flytt opp"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={i === ch.recipes.length - 1}
                            onClick={() => run(() => moveRecipe(book.id, ch.id, p.recipe.id, "down"))}
                            className="tap flex h-6 w-9 items-center justify-center text-xs text-stone hover:text-gran disabled:text-fog"
                            aria-label="Flytt ned"
                          >
                            ▼
                          </button>
                        </div>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate font-light text-ink">
                        {p.recipe.title}
                        {!isOwner && p.recipe.owner_id !== currentUserId && (
                          <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-stone">
                            av en annen
                          </span>
                        )}
                      </span>
                      {canEdit && (
                        <select
                          value={p.template_override ?? "auto"}
                          onChange={(e) =>
                            run(() =>
                              setTemplateOverride(
                                book.id,
                                ch.id,
                                p.recipe.id,
                                e.target.value === "auto" ? null : (e.target.value as PageTemplate),
                              ),
                            )
                          }
                          aria-label={`Sidemal for ${p.recipe.title}`}
                          className="h-8 rounded-none border border-line bg-snow px-2 text-xs text-ink focus:border-gran focus:outline-none"
                        >
                          <option value="auto">Auto</option>
                          {valid.map((t) => (
                            <option key={t} value={t}>
                              {TEMPLATE_LABEL[t] ?? t.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => run(() => removeRecipeFromChapter(book.id, ch.id, p.recipe.id))}
                          className="tap flex h-9 w-9 shrink-0 items-center justify-center text-lg text-stone hover:text-negative"
                          aria-label="Fjern fra boken"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  );
                })}
                {ch.recipes.length === 0 && (
                  <li className="py-3 text-sm font-light text-stone">Ingen oppskrifter ennå.</li>
                )}
              </ul>

              {/* Add recipe to this chapter */}
              <AddRecipeControl
                disabled={pending}
                recipes={availableRecipes}
                placedIds={placedIds}
                onAdd={(recipeId) => run(() => addRecipeToChapter(book.id, ch.id, recipeId))}
              />
            </section>
          ))}

          {/* Add chapter — owner only */}
          {isOwner && (
            <section className="flex items-end gap-3">
              <div className="flex-1">
                <Eyebrow>Nytt kapittel</Eyebrow>
                <Input
                  className="mt-2"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="Morgener"
                />
              </div>
              <Button
                variant="secondary"
                disabled={pending || !newChapter.trim()}
                onClick={() => {
                  const title = newChapter.trim();
                  if (!title) return;
                  setNewChapter("");
                  run(() => addChapter(book.id, { title }));
                }}
              >
                Legg til kapittel
              </Button>
            </section>
          )}
        </div>

        {/* Right: live preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Eyebrow>Direkte forhåndsvisning</Eyebrow>
            <div className="mt-4 max-h-[80vh] overflow-y-auto border border-line">
              <SpreadPreview pages={pages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContributorsPanel({
  bookId,
  contributors,
}: {
  bookId: string;
  contributors: Contributor[];
  disabled: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function invite() {
    setError(null);
    const value = email.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await inviteContributor(bookId, value);
      if (res?.error) setError(res.error);
      else setEmail("");
    });
  }

  return (
    <section className="border border-line p-5">
      <Eyebrow>Bidragsytere</Eyebrow>
      <p className="mt-2 text-sm font-light text-stone">
        Inviter familie eller venner på e-post. De legger til sine egne oppskrifter — med
        historie og signatur — i denne delte boken.
      </p>

      {contributors.length > 0 && (
        <ul className="mt-4 flex flex-col">
          {contributors.map((c) => (
            <li
              key={c.invited_email ?? c.user_id}
              className="flex items-center justify-between border-b border-line py-2.5"
            >
              <span className="font-light text-ink">
                {c.display_name ?? c.invited_email}
                <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-stone">
                  {c.accepted_at ? "med" : "invitert"}
                </span>
              </span>
              {c.invited_email && (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => void removeContributor(bookId, c.invited_email!))
                  }
                  className="px-1 text-stone hover:text-negative"
                  aria-label="Fjern bidragsyter"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="venn@eksempel.no"
        />
        <Button variant="secondary" disabled={pending || !email.trim()} onClick={invite}>
          Inviter
        </Button>
      </div>
      {error && <p className="mt-2 text-sm font-light text-negative">{error}</p>}
    </section>
  );
}

function AddRecipeControl({
  recipes,
  placedIds,
  onAdd,
  disabled,
}: {
  recipes: RecipeListItem[];
  placedIds: Set<string>;
  onAdd: (recipeId: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const options = recipes.filter((r) => !placedIds.has(r.id));

  return (
    <div className="mt-4 flex items-center gap-3">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled || options.length === 0}
        aria-label="Legg til en oppskrift i kapittelet"
        className="h-9 flex-1 rounded-none border border-line bg-snow px-2 text-sm text-ink focus:border-gran focus:outline-none disabled:text-fog"
      >
        <option value="">{options.length ? "Legg til en oppskrift…" : "Alle oppskrifter er plassert"}</option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={disabled || !value}
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
        className="text-sm font-light text-gran hover:text-ink disabled:text-fog"
      >
        Legg til
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/label";
import { RecipeForm, type RecipeFormInitial } from "@/components/recipe/recipe-form";
import { startImport, confirmImport } from "@/lib/actions/import";
import type { ImportDraft } from "@/lib/import/pipeline";
import type { SourcePlatform } from "@/lib/schemas/common";
import { cn } from "@/lib/utils";

type Mode = "url" | "text";

// Honest phases per source — the pipeline gathers text, then Claude understands
// it and rewrites it to the house style. (We don't claim to "watch the video"
// on a paste, and video/transcription aren't wired yet.)
const PHASES: Record<Mode, string[]> = {
  url: ["Henter kilden", "Leser innholdet", "Skriver om til husets stil", "Setter sammen oppskriften"],
  text: ["Leser teksten", "Kjenner igjen ingrediensene", "Skriver om til husets stil", "Setter sammen oppskriften"],
};

/** The signature import moment — status lines surface one by one while the
 *  agent actually works. Cosmetic pacing over a real server call. */
function ImportProgress({ source, mode }: { source: string; mode: Mode }) {
  const [phase, setPhase] = useState(0);
  const phases = PHASES[mode];
  useEffect(() => {
    const timers = [700, 1600, 2600, 3600].map((t, i) =>
      setTimeout(() => setPhase(i + 1), t),
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="mt-8">
      <p className="truncate text-xs font-light text-stone">{source}</p>
      <div className="mt-8 flex flex-col gap-3.5">
        {phases.map((p, i) => (
          <div
            key={p}
            className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gran transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ opacity: phase > i ? 1 : 0, transform: phase > i ? "none" : "translateY(10px)" }}
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

function draftToInitial(draft: ImportDraft): RecipeFormInitial {
  return {
    title: draft.title,
    description: draft.description ?? "",
    story: "",
    servings: draft.servings,
    prep_min: draft.prep_min,
    cook_min: draft.cook_min,
    ingredients: draft.ingredients.length
      ? draft.ingredients.map((i) => ({
          quantity: i.quantity?.toString() ?? "",
          unit: i.unit ?? "",
          name: i.name,
          note: i.note ?? "",
        }))
      : [{ quantity: "", unit: "", name: "", note: "" }],
    steps: draft.steps.length
      ? draft.steps.map((s) => ({
          text: s.text,
          timer_min: s.timer_seconds ? String(Math.round(s.timer_seconds / 60)) : "",
        }))
      : [{ text: "", timer_min: "" }],
    tags: [],
  };
}

export function ImportFlow({ initialUrl }: { initialUrl?: string }) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  function run() {
    setError(null);
    setUpgrade(false);
    startTransition(async () => {
      const res = await startImport({
        source_url: mode === "url" ? url.trim() || null : null,
        raw_text: mode === "text" ? text.trim() || null : null,
      });
      if (res.upgradeRequired) setUpgrade(true);
      if (res.error) setError(res.error);
      if (res.draft) {
        setDraft(res.draft);
        setJobId(res.jobId ?? null);
      }
    });
  }

  // Review step.
  if (draft) {
    const source = {
      platform: draft.source_platform as SourcePlatform,
      url: draft.source_url,
      author: draft.source_author,
    };
    return (
      <div>
        <Eyebrow>Se over</Eyebrow>
        <h1 className="serif mt-3 text-[27px] font-normal text-ink">Se over oppskriften</h1>
        <p className="mt-3 max-w-xl font-light text-stone">
          Alt under er skrevet om til husets stil. Rett det agenten tok feil av —
          usikre mengder er markert. Kilden krediteres alltid.
        </p>

        {draft.fallbackMessage && (
          <div className="mt-6 border-l-2 border-negative bg-mist px-4 py-3 text-sm font-light text-ink">
            {draft.fallbackMessage}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-light text-stone">
          {!draft.servingsDetected && <span className="text-negative">Porsjoner gjettet — bekreft</span>}
          {draft.source_author && <span>etter {draft.source_author}</span>}
          {draft.source_url && (
            <a href={draft.source_url} target="_blank" rel="noreferrer noopener" className="text-gran hover:text-ink">
              {draft.source_platform}-kilde
            </a>
          )}
          <span>{draft.layersUsed.join(" · ")}</span>
        </div>

        {draft.visualNotes.length > 0 && (
          <div className="mt-4 bg-salvie p-4">
            <Eyebrow onSalvie>Lagt merke til</Eyebrow>
            <ul className="mt-2 list-inside list-disc text-sm font-light text-gran">
              {draft.visualNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10">
          <RecipeForm
            initial={draftToInitial(draft)}
            submitLabel="Lagre i Arv"
            onSave={(input) => confirmImport({ jobId, recipe: input, source })}
          />
        </div>
      </div>
    );
  }

  // Input step.
  return (
    <div className="max-w-2xl">
      <Eyebrow>Importer</Eyebrow>
      <h1 className="serif mt-3 text-[27px] font-normal text-ink">Hent inn en oppskrift.</h1>
      <p className="mt-3 font-light text-stone">
        Lim inn selve oppskriftsteksten, så leser agenten den og skriver den om
        til husets stil — på norsk, med ryddige mengder og steg. Du kan også lime
        inn en lenke; klarer vi ikke å hente teksten, lim den inn selv.
      </p>

      {pending ? (
        <ImportProgress source={mode === "url" ? url.trim() || "Henter…" : "Leser inn teksten…"} mode={mode} />
      ) : (
        <>
          <div className="mt-8 flex gap-px bg-line">
            {(["url", "text"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 bg-snow px-4 py-3 text-sm transition-colors duration-150",
                  mode === m ? "bg-salvie text-gran" : "text-stone hover:bg-mist",
                )}
              >
                {m === "url" ? "Lim inn lenke" : "Lim inn tekst"}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {mode === "url" ? (
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://instagram.com/reel/… eller youtube.com/watch?v=…"
                autoFocus
              />
            ) : (
              <Textarea
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Lim inn hele oppskriften — tittel, ingredienser og steg.\n\nIngredienser\n500 g mel\n…\n\nFremgangsmåte\nBland alt sammen…"}
                autoFocus
              />
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm font-light text-negative">
              {error}
              {upgrade && (
                <Link href="/account" className="ml-2 text-gran hover:text-ink">
                  Oppgrader til Arv Pro →
                </Link>
              )}
            </div>
          )}

          <div className="mt-6">
            <Button onClick={run} disabled={mode === "url" ? !url.trim() : !text.trim()}>
              Importer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

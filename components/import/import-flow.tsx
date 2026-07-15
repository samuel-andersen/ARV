"use client";

import { useState, useTransition } from "react";
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
  const [mode, setMode] = useState<Mode>(initialUrl ? "url" : "url");
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
        <Eyebrow>Review &amp; save</Eyebrow>
        <h1 className="mt-3 text-3xl font-light text-ink">Check the recipe</h1>
        <p className="mt-3 max-w-xl font-light text-stone">
          Everything below was normalized to house style. Fix anything the agent
          got wrong — flagged quantities are marked. Attribution is kept.
        </p>

        {draft.fallbackMessage && (
          <div className="mt-6 border-l-2 border-negative bg-mist px-4 py-3 text-sm font-light text-ink">
            {draft.fallbackMessage}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-light text-stone">
          {!draft.servingsDetected && <span className="text-negative">Servings guessed — confirm</span>}
          {draft.source_author && <span>via {draft.source_author}</span>}
          {draft.source_url && (
            <a href={draft.source_url} target="_blank" rel="noreferrer noopener" className="text-gran hover:text-ink">
              {draft.source_platform} source
            </a>
          )}
          <span>{draft.layersUsed.join(" · ")}</span>
        </div>

        {draft.visualNotes.length > 0 && (
          <div className="mt-4 bg-salvie p-4">
            <Eyebrow onSalvie>Noticed on screen</Eyebrow>
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
            submitLabel="Save to your Arv"
            onSave={(input) => confirmImport({ jobId, recipe: input, source })}
          />
        </div>
      </div>
    );
  }

  // Input step.
  return (
    <div className="max-w-2xl">
      <Eyebrow>Import</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">Bring a recipe in.</h1>
      <p className="mt-3 font-light text-stone">
        Paste a link (YouTube works fully; Instagram &amp; TikTok fall back to
        the caption), or paste the recipe text. The agent watches, reads, and
        writes it down — then normalizes it.
      </p>

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
            {m === "url" ? "Paste a link" : "Paste text"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mode === "url" ? (
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            autoFocus
          />
        ) : (
          <Textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste the whole recipe — title, ingredients, and steps.\n\nIngredients\n500 g flour\n…\n\nMethod\nMix everything…"}
            autoFocus
          />
        )}
      </div>

      {error && (
        <div className="mt-4 text-sm font-light text-negative">
          {error}
          {upgrade && (
            <Link href="/settings/plan" className="ml-2 text-gran hover:text-ink">
              Upgrade to Pro →
            </Link>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={run} disabled={pending || (mode === "url" ? !url.trim() : !text.trim())}>
          {pending ? "Reading the recipe…" : "Import"}
        </Button>
      </div>
    </div>
  );
}

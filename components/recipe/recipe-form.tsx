"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Eyebrow } from "@/components/ui/label";
import { createRecipe, updateRecipe } from "@/lib/actions/recipes";
import type { RecipeInput } from "@/lib/schemas/recipe";

interface IngredientRow {
  quantity: string;
  unit: string;
  name: string;
  note: string;
}
interface StepRow {
  text: string;
  timer_min: string;
}

export interface RecipeFormInitial {
  id?: string;
  title: string;
  description: string;
  story: string;
  servings: number;
  prep_min: number | null;
  cook_min: number | null;
  ingredients: IngredientRow[];
  steps: StepRow[];
  tags: string[];
}

const EMPTY: RecipeFormInitial = {
  title: "",
  description: "",
  story: "",
  servings: 4,
  prep_min: null,
  cook_min: null,
  ingredients: [{ quantity: "", unit: "", name: "", note: "" }],
  steps: [{ text: "", timer_min: "" }],
  tags: [],
};

function numOrNull(s: string): number | null {
  const n = Number(s);
  return s.trim() === "" || Number.isNaN(n) ? null : n;
}

export function RecipeForm({
  initial,
  onSave,
  submitLabel,
}: {
  initial?: RecipeFormInitial;
  /** Override the default create/update save (used by import review). */
  onSave?: (input: RecipeInput) => Promise<{ error?: string } | void>;
  submitLabel?: string;
}) {
  const data = initial ?? EMPTY;
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description);
  const [story, setStory] = useState(data.story);
  const [servings, setServings] = useState(String(data.servings));
  const [prep, setPrep] = useState(data.prep_min?.toString() ?? "");
  const [cook, setCook] = useState(data.cook_min?.toString() ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(data.ingredients);
  const [steps, setSteps] = useState<StepRow[]>(data.steps);
  const [tags, setTags] = useState(data.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setIng(i: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function setStep(i: number, patch: Partial<StepRow>) {
    setSteps((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError(null);
    const input: RecipeInput = {
      title: title.trim(),
      description: description.trim() || null,
      story: story.trim() || null,
      servings: Number(servings) || 4,
      prep_min: numOrNull(prep),
      cook_min: numOrNull(cook),
      image_url: null,
      ingredients: ingredients
        .filter((r) => r.name.trim())
        .map((r) => ({
          quantity: numOrNull(r.quantity),
          unit: r.unit.trim() || null,
          name: r.name.trim(),
          note: r.note.trim() || null,
          needs_review: false,
        })),
      steps: steps
        .filter((r) => r.text.trim())
        .map((r) => ({
          text: r.text.trim(),
          timer_seconds: (() => {
            const m = numOrNull(r.timer_min);
            return m ? Math.round(m * 60) : null;
          })(),
        })),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (!input.title) return setError("Gi oppskriften en tittel.");
    if (!input.ingredients.length) return setError("Legg til minst én ingrediens.");
    if (!input.steps.length) return setError("Legg til minst ett steg.");

    startTransition(async () => {
      const result = onSave
        ? await onSave(input)
        : data.id
          ? await updateRecipe(data.id, input)
          : await createRecipe(input);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <Field label="Tittel" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mormors kardemommeboller" />
        </Field>
        <Field label="Beskrivelse" htmlFor="desc" hint="Én linje om retten.">
          <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Historie" htmlFor="story" hint="Hvorfor denne oppskriften betyr noe — boken er ment å skrives i.">
          <Textarea id="story" rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Porsjoner" htmlFor="servings">
            <Input id="servings" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} />
          </Field>
          <Field label="Forb. (min)" htmlFor="prep">
            <Input id="prep" inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value)} />
          </Field>
          <Field label="Steking (min)" htmlFor="cook">
            <Input id="cook" inputMode="numeric" value={cook} onChange={(e) => setCook(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Ingredients */}
      <section>
        <Eyebrow>Ingredienser</Eyebrow>
        <div className="mt-4 flex flex-col gap-2">
          {ingredients.map((r, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 border-b border-line py-2 sm:border-0 sm:py-0"
            >
              <Input className="w-16" inputMode="decimal" placeholder="Mengde" value={r.quantity} onChange={(e) => setIng(i, { quantity: e.target.value })} />
              <Input className="w-[72px]" placeholder="Enhet" value={r.unit} onChange={(e) => setIng(i, { unit: e.target.value })} />
              <Input className="min-w-[45%] flex-1" placeholder="Ingrediens" value={r.name} onChange={(e) => setIng(i, { name: e.target.value })} />
              <Input className="min-w-[45%] flex-1" placeholder="Notat (valgfritt)" value={r.note} onChange={(e) => setIng(i, { note: e.target.value })} />
              <button
                type="button"
                onClick={() => setIngredients((p) => p.filter((_, idx) => idx !== i))}
                className="tap ml-auto px-2 text-lg text-stone hover:text-negative"
                aria-label="Fjern ingrediens"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((p) => [...p, { quantity: "", unit: "", name: "", note: "" }])}
          className="tap mt-3 inline-flex min-h-11 items-center text-sm font-light text-gran hover:text-ink"
        >
          + Legg til ingrediens
        </button>
      </section>

      {/* Steps */}
      <section>
        <Eyebrow>Fremgangsmåte</Eyebrow>
        <div className="mt-4 flex flex-col gap-3">
          {steps.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-3 w-6 shrink-0 text-sm font-light text-stone">{i + 1}.</span>
              <div className="flex-1">
                <Textarea rows={2} placeholder="Beskriv steget" value={r.text} onChange={(e) => setStep(i, { text: e.target.value })} />
              </div>
              <div className="w-20 shrink-0">
                <Input placeholder="Timer" inputMode="numeric" value={r.timer_min} onChange={(e) => setStep(i, { timer_min: e.target.value })} />
              </div>
              <button
                type="button"
                onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                className="tap mt-3 px-2 text-lg text-stone hover:text-negative"
                aria-label="Fjern steg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((p) => [...p, { text: "", timer_min: "" }])}
          className="tap mt-3 inline-flex min-h-11 items-center text-sm font-light text-gran hover:text-ink"
        >
          + Legg til steg
        </button>
      </section>

      <Field label="Emneknagger" htmlFor="tags" hint="Skill med komma.">
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="baking, familie" />
      </Field>

      {error && <p className="text-sm font-light text-negative">{error}</p>}

      <div className="flex items-center gap-4">
        <Button onClick={submit} disabled={pending}>
          {pending ? "Lagrer…" : (submitLabel ?? (data.id ? "Lagre endringer" : "Lagre oppskrift"))}
        </Button>
      </div>
    </div>
  );
}

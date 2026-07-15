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

    if (!input.title) return setError("Give the recipe a title.");
    if (!input.ingredients.length) return setError("Add at least one ingredient.");
    if (!input.steps.length) return setError("Add at least one step.");

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
        <Field label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grandmother's Cardamom Buns" />
        </Field>
        <Field label="Description" htmlFor="desc" hint="One line about the dish.">
          <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Story" htmlFor="story" hint="Why this recipe matters — the book is meant to be written in.">
          <Textarea id="story" rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Serves" htmlFor="servings">
            <Input id="servings" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} />
          </Field>
          <Field label="Prep (min)" htmlFor="prep">
            <Input id="prep" inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value)} />
          </Field>
          <Field label="Cook (min)" htmlFor="cook">
            <Input id="cook" inputMode="numeric" value={cook} onChange={(e) => setCook(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Ingredients */}
      <section>
        <Eyebrow>Ingredients</Eyebrow>
        <div className="mt-4 flex flex-col gap-2">
          {ingredients.map((r, i) => (
            <div key={i} className="grid grid-cols-[64px_80px_1fr_1fr_auto] items-center gap-2">
              <Input placeholder="Qty" value={r.quantity} onChange={(e) => setIng(i, { quantity: e.target.value })} />
              <Input placeholder="Unit" value={r.unit} onChange={(e) => setIng(i, { unit: e.target.value })} />
              <Input placeholder="Ingredient" value={r.name} onChange={(e) => setIng(i, { name: e.target.value })} />
              <Input placeholder="Note (optional)" value={r.note} onChange={(e) => setIng(i, { note: e.target.value })} />
              <button
                type="button"
                onClick={() => setIngredients((p) => p.filter((_, idx) => idx !== i))}
                className="px-2 text-stone hover:text-negative"
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((p) => [...p, { quantity: "", unit: "", name: "", note: "" }])}
          className="mt-3 text-sm font-light text-gran hover:text-ink"
        >
          + Add ingredient
        </button>
      </section>

      {/* Steps */}
      <section>
        <Eyebrow>Method</Eyebrow>
        <div className="mt-4 flex flex-col gap-3">
          {steps.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-3 w-6 shrink-0 text-sm font-light text-stone">{i + 1}.</span>
              <div className="flex-1">
                <Textarea rows={2} placeholder="Describe the step" value={r.text} onChange={(e) => setStep(i, { text: e.target.value })} />
              </div>
              <div className="w-28 shrink-0">
                <Input placeholder="Timer min" inputMode="numeric" value={r.timer_min} onChange={(e) => setStep(i, { timer_min: e.target.value })} />
              </div>
              <button
                type="button"
                onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                className="mt-3 px-2 text-stone hover:text-negative"
                aria-label="Remove step"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((p) => [...p, { text: "", timer_min: "" }])}
          className="mt-3 text-sm font-light text-gran hover:text-ink"
        >
          + Add step
        </button>
      </section>

      <Field label="Tags" htmlFor="tags" hint="Comma separated.">
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="baking, family" />
      </Field>

      {error && <p className="text-sm font-light text-negative">{error}</p>}

      <div className="flex items-center gap-4">
        <Button onClick={submit} disabled={pending}>
          {pending ? "Saving…" : submitLabel ?? (data.id ? "Save changes" : "Save recipe")}
        </Button>
      </div>
    </div>
  );
}

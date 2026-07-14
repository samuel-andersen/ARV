"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createBook } from "@/lib/actions/books";
import { bookStyleEnum, type BookStyle } from "@/lib/schemas/common";
import { cn } from "@/lib/utils";

const STYLE_NOTES: Record<BookStyle, string> = {
  editorial: "The Arv aesthetic — serif, generous, quiet.",
  rustic: "Warmer. (Arrives later.)",
  minimal: "Strict Scandinavian. (Arrives later.)",
};

export function NewBookForm() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [style, setStyle] = useState<BookStyle>("editorial");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!title.trim()) return setError("Give the book a title.");
    startTransition(async () => {
      const res = await createBook({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        dedication: dedication.trim() || null,
        style,
        trim_size: "20x25",
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Field label="Title" htmlFor="title">
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Kitchen" />
      </Field>
      <Field label="Subtitle" htmlFor="subtitle">
        <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A first gathering" />
      </Field>
      <Field label="Dedication" htmlFor="ded">
        <Textarea id="ded" rows={2} value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="For everyone who ever cooked at this table." />
      </Field>

      <div>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone">Style</span>
        <div className="mt-3 grid grid-cols-3 gap-px bg-line">
          {bookStyleEnum.options.map((s) => {
            const disabled = s !== "editorial";
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => setStyle(s)}
                className={cn(
                  "bg-snow p-4 text-left transition-colors duration-150",
                  style === s && "bg-salvie",
                  disabled ? "cursor-not-allowed text-fog" : "hover:bg-mist",
                )}
              >
                <span className={cn("text-sm capitalize", disabled ? "text-fog" : "text-ink")}>{s}</span>
                <p className={cn("mt-1 text-xs font-light", style === s ? "text-gran" : "text-stone")}>
                  {STYLE_NOTES[s]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm font-light text-negative">{error}</p>}

      <div>
        <Button onClick={submit} disabled={pending}>
          {pending ? "Creating…" : "Create book"}
        </Button>
      </div>
    </div>
  );
}

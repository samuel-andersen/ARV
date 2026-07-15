"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { Eyebrow } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CHOICES = [
  { value: "myself", label: "Myself", hint: "The recipes I actually cook." },
  { value: "family", label: "My family", hint: "The dishes we pass down." },
  { value: "gift", label: "A gift", hint: "A book for someone I love." },
] as const;

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: string) {
    if (pending) return;
    setSelected(value);
    startTransition(() => {
      void completeOnboarding(value);
    });
  }

  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6"
      style={{
        paddingTop: "calc(var(--safe-top) + 32px)",
        paddingBottom: "calc(var(--safe-bottom) + 32px)",
      }}
    >
      <div className="rise-in" style={{ animationDelay: "40ms" }}>
        <Eyebrow>One question</Eyebrow>
        <h1 className="mt-6 text-4xl font-light leading-tight text-ink">
          Who are you collecting recipes for?
        </h1>
        <p className="mt-4 font-light text-stone">
          It helps us set the tone. You can change your mind anytime.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {CHOICES.map((c, i) => {
          const isSelected = selected === c.value;
          return (
            <button
              key={c.value}
              type="button"
              disabled={pending}
              onClick={() => choose(c.value)}
              style={{ animationDelay: `${140 + i * 90}ms` }}
              className={cn(
                "tap rise-in flex items-center justify-between border p-5 text-left transition-colors duration-150",
                isSelected
                  ? "border-gran bg-salvie"
                  : "border-line bg-snow hover:border-gran",
              )}
            >
              <span className="flex flex-col">
                <span className={cn("text-lg font-light", isSelected ? "text-gran" : "text-ink")}>
                  {c.label}
                </span>
                <span className="mt-0.5 text-sm font-light text-stone">{c.hint}</span>
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center border text-xs transition-all duration-150",
                  isSelected ? "border-gran bg-gran text-snow" : "border-line text-transparent",
                )}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="rise-in mt-8 text-center text-[11px] uppercase tracking-[0.22em] text-stone"
        style={{ animationDelay: "440ms" }}
      >
        {pending ? "Setting up your kitchen…" : "Tap to continue"}
      </p>
    </main>
  );
}

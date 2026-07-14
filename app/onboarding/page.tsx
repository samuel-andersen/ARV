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
    setSelected(value);
    startTransition(() => {
      void completeOnboarding(value);
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <Eyebrow>One question</Eyebrow>
      <h1 className="mt-6 text-4xl font-light leading-tight text-ink">
        Who are you collecting recipes for?
      </h1>
      <p className="mt-4 font-light text-stone">
        It helps us set the tone. You can change your mind anytime.
      </p>

      <div className="mt-10 flex flex-col">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            disabled={pending}
            onClick={() => choose(c.value)}
            className={cn(
              "flex items-baseline justify-between border-b border-line py-5 text-left",
              "transition-colors duration-150 hover:bg-mist",
              selected === c.value && "bg-salvie",
            )}
          >
            <span className="text-lg font-light text-ink">{c.label}</span>
            <span className="text-sm font-light text-stone">{c.hint}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

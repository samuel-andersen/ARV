"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { Eyebrow } from "@/components/ui/label";
import { okHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const CHOICES = [
  { value: "family", label: "Familien", hint: "Rettene vi gir videre." },
  { value: "myself", label: "Meg selv", hint: "Oppskriftene jeg faktisk lager." },
  { value: "gift", label: "En gave", hint: "En bok til noen jeg er glad i." },
] as const;

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: string) {
    if (pending) return;
    okHaptic();
    setError(null);
    setSelected(value);
    startTransition(async () => {
      try {
        await completeOnboarding(value);
      } catch {
        // A thrown redirect is normal control flow in Next — only surface real
        // failures so the user isn't stuck on a dead, disabled screen.
        setError("Noe stoppet opp. Prøv igjen.");
        setSelected(null);
      }
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
        <Eyebrow>Ett spørsmål</Eyebrow>
        <h1 className="serif mt-6 text-[34px] font-normal leading-tight text-ink">
          Hvem samler du oppskrifter for?
        </h1>
        <p className="mt-4 font-light text-stone">
          Det hjelper oss å sette tonen. Du kan ombestemme deg når som helst.
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
                <span className={cn("serif text-[19px]", isSelected ? "text-gran" : "text-ink")}>
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

      {error ? (
        <p className="mt-8 text-center text-[13px] font-light text-negative">{error}</p>
      ) : (
        <p
          className="rise-in mt-8 text-center text-[11px] uppercase tracking-[0.22em] text-stone"
          style={{ animationDelay: "440ms" }}
        >
          {pending ? "Gjør klar kjøkkenet ditt…" : "Trykk for å fortsette"}
        </p>
      )}
    </main>
  );
}

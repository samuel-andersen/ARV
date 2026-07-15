"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Ingredient, Step } from "@/lib/schemas/recipe";

/** Minimal shapes so we don't depend on the DOM lib's experimental typings. */
type WakeSentinel = { release: () => Promise<void>; released?: boolean };
type WakeNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeSentinel> };
};
type VibrateNavigator = Navigator & { vibrate?: (pattern: number | number[]) => boolean };

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerState {
  remaining: number;
  running: boolean;
  done: boolean;
}

export function CookModeLauncher({
  title,
  ingredients,
  steps,
}: {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
}) {
  const [open, setOpen] = useState(false);

  if (!steps.length) return null;

  return (
    <>
      <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        Cook mode
      </Button>
      {open && (
        <CookMode
          title={title}
          ingredients={ingredients}
          steps={steps}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CookMode({
  title,
  ingredients,
  steps,
  onClose,
}: {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, TimerState>>(() => {
    const init: Record<string, TimerState> = {};
    for (const s of steps) {
      if (s.timer_seconds) {
        init[s.id] = { remaining: s.timer_seconds, running: false, done: false };
      }
    }
    return init;
  });

  const wakeRef = useRef<WakeSentinel | null>(null);
  const touchStartX = useRef<number | null>(null);

  const atEnd = index >= steps.length;
  const step = atEnd ? null : steps[index];

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, steps.length)), [steps.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  /* ---- Wake lock: keep the screen on while cooking. ---- */
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      const nav = navigator as WakeNavigator;
      if (!nav.wakeLock) return;
      try {
        const sentinel = await nav.wakeLock.request("screen");
        if (cancelled) {
          void sentinel.release();
        } else {
          wakeRef.current = sentinel;
        }
      } catch {
        /* denied / not visible — silently continue without keep-awake */
      }
    }
    function onVisibility() {
      // iOS releases the lock when backgrounded — re-acquire on return.
      if (document.visibilityState === "visible" && !wakeRef.current) void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.style.overflow = "";
      void wakeRef.current?.release();
      wakeRef.current = null;
    };
  }, []);

  /* ---- One ticker drives every running timer (persists across steps). ---- */
  useEffect(() => {
    const id = setInterval(() => {
      setTimers((prev) => {
        let changed = false;
        const nextT: Record<string, TimerState> = {};
        for (const [key, t] of Object.entries(prev)) {
          if (t.running && t.remaining > 0) {
            changed = true;
            const remaining = t.remaining - 1;
            const done = remaining === 0;
            if (done) (navigator as VibrateNavigator).vibrate?.([200, 100, 200]);
            nextT[key] = { remaining, running: !done, done };
          } else {
            nextT[key] = t;
          }
        }
        return changed ? nextT : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- Keyboard support (external keyboard / desktop). ---- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  function toggleTimer(stepId: string) {
    setTimers((prev) => {
      const t = prev[stepId];
      if (!t) return prev;
      if (t.remaining === 0) {
        const base = steps.find((s) => s.id === stepId)?.timer_seconds ?? 0;
        return { ...prev, [stepId]: { remaining: base, running: true, done: false } };
      }
      return { ...prev, [stepId]: { ...t, running: !t.running } };
    });
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-snow"
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Cook mode: ${title}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone tabular-nums">
          {atEnd ? "Done" : `Step ${index + 1} / ${steps.length}`}
        </span>
        <span className="max-w-[50%] truncate text-[11px] font-medium uppercase tracking-[0.22em] text-stone">
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="tap -mr-2 px-2 text-2xl font-light leading-none text-stone hover:text-gran"
          aria-label="Close cook mode"
        >
          ×
        </button>
      </div>

      {/* Progress hairline */}
      <div className="h-px bg-line">
        <div
          className="h-px bg-gran transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${(Math.min(index, steps.length) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step area — tap right to advance, left to go back. */}
      <div
        className="relative flex flex-1 select-none flex-col items-center justify-center px-7"
        onClick={(e) => {
          if (showIngredients) return;
          const half = e.currentTarget.clientWidth / 2;
          if (e.nativeEvent.offsetX < half * 0.5) prev();
          else next();
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (startX != null && endX != null) {
            const dx = endX - startX;
            if (dx < -50) next();
            else if (dx > 50) prev();
          }
          touchStartX.current = null;
        }}
      >
        {atEnd ? (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-salvie text-2xl text-gran">
              ✓
            </div>
            <h2 className="mt-6 text-3xl font-light text-ink">All done.</h2>
            <p className="mt-3 font-light text-stone">Enjoy — you cooked {title}.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setIndex(steps.length - 1)}>
                Back
              </Button>
              <Button onClick={onClose}>Finish</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center">
            <span className="text-[80px] font-light leading-none text-fog tabular-nums">
              {index + 1}
            </span>
            <p className="mt-6 text-2xl font-light leading-relaxed text-ink sm:text-3xl">
              {step!.text}
            </p>

            {step!.timer_seconds && timers[step!.id] && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTimer(step!.id);
                }}
                className={cn(
                  "mt-8 inline-flex items-center gap-3 px-5 py-3 text-lg tabular-nums transition-colors duration-150",
                  timers[step!.id].done
                    ? "bg-salvie text-positive"
                    : "bg-salvie text-gran",
                )}
              >
                <span className="text-sm font-medium uppercase tracking-[0.18em]">
                  {timers[step!.id].done
                    ? "Time's up"
                    : timers[step!.id].running
                      ? "Pause"
                      : timers[step!.id].remaining < (step!.timer_seconds ?? 0)
                        ? "Resume"
                        : "Start"}
                </span>
                <span className="font-light">{fmt(timers[step!.id].remaining)}</span>
              </button>
            )}
          </div>
        )}

        {!atEnd && (
          <p className="pointer-events-none absolute bottom-4 text-[11px] uppercase tracking-[0.22em] text-fog">
            Tap to continue · swipe to move
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="tap text-sm font-light text-gran disabled:text-fog"
        >
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={() => setShowIngredients(true)}
          className="tap text-[11px] font-medium uppercase tracking-[0.22em] text-stone hover:text-gran"
        >
          Ingredients{checkedCount > 0 ? ` · ${checkedCount}/${ingredients.length}` : ""}
        </button>
        <button
          type="button"
          onClick={next}
          className="tap text-sm font-light text-gran"
        >
          {index >= steps.length - 1 ? "Finish ›" : "Next ›"}
        </button>
      </div>

      {/* Ingredients checklist — slide-up sheet */}
      {showIngredients && (
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end bg-ink/30"
          onClick={() => setShowIngredients(false)}
        >
          <div
            className="max-h-[75%] overflow-y-auto bg-snow"
            style={{ paddingBottom: "calc(var(--safe-bottom) + 16px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <Eyebrow>Ingredients</Eyebrow>
              <button
                type="button"
                onClick={() => setShowIngredients(false)}
                className="tap px-2 text-2xl font-light leading-none text-stone hover:text-gran"
                aria-label="Close ingredients"
              >
                ×
              </button>
            </div>
            <ul className="px-6">
              {ingredients.map((ing) => {
                const on = !!checked[ing.id];
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      onClick={() => setChecked((c) => ({ ...c, [ing.id]: !c[ing.id] }))}
                      className="tap flex w-full items-center gap-3 border-b border-line py-3 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center border text-xs",
                          on ? "border-gran bg-gran text-snow" : "border-line text-transparent",
                        )}
                      >
                        ✓
                      </span>
                      <span className={cn("flex-1 font-light", on ? "text-fog line-through" : "text-ink")}>
                        {ing.name}
                        {ing.note ? <span className="text-stone">, {ing.note}</span> : null}
                      </span>
                      <span className={cn("shrink-0 font-light", on ? "text-fog" : "text-stone")}>
                        {ing.quantity != null
                          ? `${ing.quantity}${ing.unit ? " " + ing.unit : ""}`
                          : ing.unit ?? ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

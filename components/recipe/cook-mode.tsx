"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { okHaptic, tapHaptic } from "@/lib/haptics";
import { CookFinishPhoto } from "@/components/recipe/cook-finish-photo";
import { logCook } from "@/lib/actions/organize";
import type { Ingredient, Step } from "@/lib/schemas/recipe";

/** Owner-only capture at the end of cooking; absent on public/shared pages. */
export interface CookPhotoTarget {
  recipeId: string;
  userId: string;
  hasImage: boolean;
}

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
  photo,
  logRecipeId,
}: {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  photo?: CookPhotoTarget;
  /** When set, records a cook for this recipe once the flow reaches the end. */
  logRecipeId?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!steps.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap w-full bg-gran px-5 py-[15px] text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
      >
        Begynn å lage
      </button>
      {open && (
        <CookMode
          title={title}
          ingredients={ingredients}
          steps={steps}
          photo={photo}
          logRecipeId={logRecipeId}
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
  photo,
  logRecipeId,
  onClose,
}: {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  photo?: CookPhotoTarget;
  logRecipeId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const photoSaved = useRef(false);
  const cookLogged = useRef(false);

  // If the cook photographed their result, refresh the recipe page on close so
  // the new cover shows immediately.
  const close = useCallback(() => {
    if (photoSaved.current || cookLogged.current) router.refresh();
    onClose();
  }, [onClose, router]);
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

  // Record the cook exactly once when the flow reaches the end.
  useEffect(() => {
    if (atEnd && logRecipeId && !cookLogged.current) {
      cookLogged.current = true;
      void logCook(logRecipeId);
    }
  }, [atEnd, logRecipeId]);
  const step = atEnd ? null : steps[index];

  const next = useCallback(() => {
    tapHaptic();
    setIndex((i) => Math.min(i + 1, steps.length));
  }, [steps.length]);
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
      else if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close]);

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
  const total = steps.length;
  const stepNo = String(Math.min(index, total - 1) + 1).padStart(2, "0");

  return (
    <div
      className="overlay-in fixed inset-0 z-[100] flex flex-col bg-papir"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Kokkemodus: ${title}`}
    >
      {/* Top: progress dots + close */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1 transition-all duration-[250ms]",
                i === index ? "w-[22px]" : "w-2.5",
                i <= index ? "bg-gran" : "bg-line",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={close}
          className="tap -mr-2 px-2 text-xl font-light leading-none text-stone hover:text-gran"
          aria-label="Lukk kokkemodus"
        >
          ×
        </button>
      </div>

      {/* Step area — tap right to advance, left to go back. */}
      <div
        className="relative flex flex-1 select-none flex-col justify-center gap-8 px-7"
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
          <div onClick={(e) => e.stopPropagation()}>
            <div className="flex h-11 w-11 items-center justify-center bg-salvie text-lg text-gran">
              ✓
            </div>
            <h2 className="serif mt-6 text-[30px] font-normal leading-tight text-ink">
              Ferdig laget.
            </h2>
            <p className="mt-3 font-light text-stone">Vel bekomme — du lagde {title}.</p>

            {/* Close the loop: photograph the result → recipe cover → the book. */}
            {photo && (
              <CookFinishPhoto
                recipeId={photo.recipeId}
                userId={photo.userId}
                hasImage={photo.hasImage}
                onSaved={() => {
                  photoSaved.current = true;
                }}
              />
            )}

            <div className="mt-8 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIndex(steps.length - 1)}
                className="tap border border-line px-5 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
              >
                Tilbake
              </button>
              <button
                type="button"
                onClick={() => {
                  okHaptic();
                  close();
                }}
                className="tap bg-gran px-5 py-3 text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
              >
                Fullfør
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gran">
              Steg {stepNo} av {String(total).padStart(2, "0")}
            </span>
            <p className="serif text-[30px] font-normal leading-[1.3] text-ink" style={{ textWrap: "pretty" }}>
              {step!.text}
            </p>

            {step!.timer_seconds && timers[step!.id] && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTimer(step!.id);
                }}
                className="block w-full text-left"
              >
                <div className="mb-2 flex items-center justify-between text-[10.5px] font-medium uppercase tracking-[0.22em] text-stone">
                  <span>
                    {timers[step!.id].done
                      ? "Tiden er ute"
                      : timers[step!.id].running
                        ? "Pause"
                        : timers[step!.id].remaining < (step!.timer_seconds ?? 0)
                          ? "Fortsett"
                          : "Start timer"}
                  </span>
                  <span className="text-gran tabular-nums">
                    {fmt(timers[step!.id].remaining)}
                  </span>
                </div>
                <div className="relative h-1.5 bg-salvie">
                  <div
                    className="absolute inset-y-0 left-0 bg-gran transition-all duration-[250ms]"
                    style={{
                      width: `${((((step!.timer_seconds ?? 1) - timers[step!.id].remaining) / (step!.timer_seconds ?? 1)) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
              </button>
            )}
          </>
        )}

        {!atEnd && (
          <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-[12.5px] font-light text-stone">
            Trykk hvor som helst for neste steg
          </p>
        )}
      </div>

      {/* Bottom Salvie bar — ingredients */}
      {!atEnd && (
        <button
          type="button"
          onClick={() => setShowIngredients(true)}
          className="tap flex items-center justify-between border-t border-line bg-salvie px-6 py-3.5"
        >
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gran">
            Ingredienser · {checkedCount} av {ingredients.length} brukt
          </span>
          <span className="text-[13px] font-light text-gran">↑</span>
        </button>
      )}

      {/* Ingredients checklist — slide-up sheet */}
      {showIngredients && (
        <div
          className="scrim-in absolute inset-0 z-10 flex flex-col justify-end bg-ink/30"
          onClick={() => setShowIngredients(false)}
        >
          <div
            className="sheet-up scroll-y max-h-[75%] overflow-y-auto bg-snow"
            style={{ paddingBottom: "calc(var(--safe-bottom) + 16px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
                Ingredienser
              </span>
              <button
                type="button"
                onClick={() => setShowIngredients(false)}
                className="tap px-2 text-xl font-light leading-none text-stone hover:text-gran"
                aria-label="Lukk ingredienser"
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
                      onClick={() => {
                        tapHaptic();
                        setChecked((c) => ({ ...c, [ing.id]: !c[ing.id] }));
                      }}
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
                      <span className={cn("flex-1 text-[13.5px]", on ? "text-fog line-through" : "text-ink")}>
                        {ing.name}
                        {ing.note ? <span className="text-stone">, {ing.note}</span> : null}
                      </span>
                      <span className={cn("shrink-0 text-[13.5px]", on ? "text-fog" : "text-stone")}>
                        {ing.quantity != null
                          ? `${ing.quantity}${ing.unit ? " " + ing.unit : ""}`
                          : (ing.unit ?? "")}
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

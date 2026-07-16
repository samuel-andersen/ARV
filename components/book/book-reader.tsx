"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageInner } from "@/components/book/spread-preview";
import { tapHaptic } from "@/lib/haptics";
import type { PageModel } from "@/lib/book/layout";

/**
 * Lesemodus — full-screen, page-by-page book reader. One paper page (4:5) on
 * the Mist "table", tap the right 65% to turn forward, the left 35% to go back
 * (or swipe). Mirrors the handoff's "full visning".
 */
export function BookReader({
  pages,
  title,
  onClose,
}: {
  pages: PageModel[];
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const page = pages[index];

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < pages.length - 1) tapHaptic();
      return Math.min(i + 1, pages.length - 1);
    });
  }, [pages.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [next, prev, onClose]);

  const chapterTitle =
    page.kind === "chapter_opener"
      ? page.title
      : page.kind === "recipe"
        ? page.recipe.title
        : title;

  return (
    <div
      className="overlay-in fixed inset-0 z-[100] flex flex-col bg-mist"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Leser ${title}`}
    >
      {/* Running header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="serif truncate text-[12px] text-stone">
          {chapterTitle} · 20 × 25 cm
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk lesemodus"
          className="tap -mr-2 px-2 text-xl font-light leading-none text-stone hover:text-gran"
        >
          ×
        </button>
      </div>

      {/* Page — tap right to advance, left to go back. */}
      <div
        className="flex min-h-0 flex-1 select-none items-center justify-center px-5"
        onClick={(e) => {
          const w = e.currentTarget.clientWidth;
          if (e.nativeEvent.offsetX < w * 0.35) prev();
          else next();
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX ?? null;
          if (start != null && end != null) {
            const dx = end - start;
            if (dx < -50) next();
            else if (dx > 50) prev();
          }
          touchStartX.current = null;
        }}
      >
        <div
          className="relative h-full max-h-[640px] overflow-hidden bg-white"
          style={{
            aspectRatio: "4/5",
            containerType: "inline-size",
            boxShadow: "0 26px 50px -26px rgba(20,20,19,0.32)",
          }}
        >
          <PageInner page={page} />
        </div>
      </div>

      {/* Folio + hint */}
      <div className="pb-6 pt-2 text-center">
        <div className="serif text-[12px] text-stone tabular-nums">
          {index + 1} / {pages.length}
        </div>
        <div className="mt-1 text-[11px] font-light text-stone">
          Trykk høyre side for å bla · venstre for tilbake
        </div>
      </div>
    </div>
  );
}

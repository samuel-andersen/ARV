"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tapHaptic } from "@/lib/haptics";

/**
 * Native-feeling pull-to-refresh. Engages only at the top of the page (we've
 * disabled the browser's own overscroll bounce), applies drag resistance, and
 * calls router.refresh() — which re-runs the server components in place.
 * Touch-only; a no-op with a mouse.
 */
const THRESHOLD = 72;
const MAX = 96;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const armed = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onStart(e: React.TouchEvent) {
    if (window.scrollY > 0 || refreshing) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0]?.clientY ?? null;
  }
  function onMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
    const next = dy <= 0 ? 0 : Math.min(MAX, dy * 0.5);
    // Fire a single "catch" tap the moment we cross the release threshold.
    if (next >= THRESHOLD && !armed.current) {
      armed.current = true;
      tapHaptic();
    } else if (next < THRESHOLD) {
      armed.current = false;
    }
    setPull(next);
  }
  function onEnd() {
    if (startY.current == null) return;
    const trigger = pull >= THRESHOLD;
    startY.current = null;
    armed.current = false;
    if (trigger) {
      setRefreshing(true);
      setPull(THRESHOLD * 0.6);
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, 650);
    } else {
      setPull(0);
    }
  }

  const progress = Math.min(1, pull / THRESHOLD);
  const settling = startY.current == null;

  return (
    <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
      {/* Indicator */}
      <div
        className="pointer-events-none flex items-center justify-center overflow-hidden"
        style={{
          height: pull,
          opacity: pull > 4 || refreshing ? 1 : 0,
          transition: settling ? "height .25s var(--ease-arv), opacity .2s" : "none",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-gran"
          style={{
            transform: `rotate(${pull * 4}deg)`,
            animation: refreshing ? "spin .8s linear infinite" : "none",
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray={Math.PI * 2 * 9}
            strokeDashoffset={(1 - (refreshing ? 0.75 : progress)) * Math.PI * 2 * 9}
          />
        </svg>
      </div>

      {children}
    </div>
  );
}

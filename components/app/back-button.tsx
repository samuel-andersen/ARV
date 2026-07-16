"use client";

import { useRouter } from "next/navigation";
import { tapHaptic } from "@/lib/haptics";

/**
 * Native-style back affordance — pops the history stack when there is one,
 * else falls back to a sensible home. The white chip reads over photo heroes.
 */
export function BackButton({ fallback = "/library" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Tilbake"
      onClick={() => {
        tapHaptic();
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="tap absolute left-3.5 top-3.5 flex h-9 w-9 items-center justify-center bg-snow text-lg font-light text-ink"
    >
      ←
    </button>
  );
}

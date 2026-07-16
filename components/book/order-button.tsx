"use client";

import { useState, useTransition } from "react";
import { orderBook } from "@/lib/actions/books";
import { okHaptic } from "@/lib/haptics";

export function OrderButton({ bookId }: { bookId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          okHaptic();
          startTransition(async () => {
            const res = await orderBook(bookId);
            if (res?.error) setError(res.error);
          });
        }}
        className="tap w-full bg-gran px-5 py-[15px] text-[13px] font-medium text-snow transition-opacity hover:opacity-85 disabled:opacity-70"
      >
        {pending ? "Sender bestillingen…" : "Bestill · 799 kr"}
      </button>
      {error && <p className="mt-2 text-xs font-light text-negative">{error}</p>}
    </div>
  );
}

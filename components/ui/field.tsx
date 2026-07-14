import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A labelled form field. The label uses the Arv eyebrow treatment; errors use
 * the Negative semantic color (product state only).
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone"
      >
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs font-light text-stone">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-light text-negative">{error}</p>
      ) : null}
    </div>
  );
}

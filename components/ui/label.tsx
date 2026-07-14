import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The Arv eyebrow label: 11px, +0.22em, uppercase, Stone by default —
 * Gran when it sits on a Salvie surface (pass `onSalvie`, since Stone fails
 * contrast there).
 */
export interface EyebrowProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  onSalvie?: boolean;
}

export function Eyebrow({ className, onSalvie, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.22em]",
        onSalvie ? "text-gran" : "text-stone",
        className,
      )}
      {...props}
    />
  );
}

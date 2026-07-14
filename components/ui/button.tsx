import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Arv button. Gran is the only interactive color, so the palette here is fixed:
 * primary = solid Gran, secondary = hairline outline, ghost = text-only.
 * Zero radius, no shadow. Motion 150ms on the Arv ease.
 */
type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-medium " +
  "rounded-none transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "focus-visible:outline-2 focus-visible:outline-gran focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:bg-fog disabled:text-stone";

const variants: Record<Variant, string> = {
  primary: "bg-gran text-snow hover:bg-ink",
  secondary: "bg-snow text-ink border border-line hover:border-gran hover:text-gran",
  ghost: "bg-transparent text-gran hover:text-ink",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

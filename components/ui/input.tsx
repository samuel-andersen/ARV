import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Arv text input. Hairline border, zero radius, Gran focus ring, Fog
 * placeholders. No shadow. Height on the 8pt grid.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-none border border-line bg-snow px-3 text-sm text-ink",
        "placeholder:text-fog transition-colors duration-150",
        "focus:border-gran focus:outline-none",
        "disabled:bg-mist disabled:text-stone",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-none border border-line bg-snow px-3 py-2 text-sm text-ink",
      "placeholder:text-fog transition-colors duration-150",
      "focus:border-gran focus:outline-none",
      "disabled:bg-mist disabled:text-stone",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

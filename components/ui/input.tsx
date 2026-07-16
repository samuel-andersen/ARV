import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Arv text input. Hairline border, zero radius, Gran focus ring. Base size is
 * 16px — the iOS-native threshold that keeps Safari from zooming the viewport
 * on focus, and simply more legible on a phone. Placeholders sit in Stone, not
 * the near-invisible Fog.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-none border border-line bg-snow px-3.5 text-[16px] text-ink",
        "placeholder:text-stone/70 transition-colors duration-150",
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
      "w-full rounded-none border border-line bg-snow px-3.5 py-2.5 text-[16px] text-ink",
      "placeholder:text-stone/70 transition-colors duration-150",
      "focus:border-gran focus:outline-none",
      "disabled:bg-mist disabled:text-stone",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

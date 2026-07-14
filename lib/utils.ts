/**
 * Minimal class-name joiner. Kept dependency-free on purpose — the Arv chrome
 * uses a small, hand-built primitive set rather than a large component library,
 * so we don't need clsx/tailwind-merge here yet.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

"use client";

import { useState } from "react";

/** One-click copy of the whole debug log to the clipboard. */
export function CopyDebug({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that block the async clipboard API.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="tap bg-gran px-5 py-3 text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
    >
      {copied ? "Kopiert ✓" : "Kopier alt"}
    </button>
  );
}

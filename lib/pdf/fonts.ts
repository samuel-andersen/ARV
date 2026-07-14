import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Register the print fonts once. Files are vendored under assets/fonts so the
 * build is deterministic and offline (no fetch at render time). Fraunces is the
 * Editorial book serif; Inter carries labels and small chrome inside the book.
 */
let registered = false;

function fontPath(file: string): string {
  return path.join(process.cwd(), "assets", "fonts", file);
}

export function registerPrintFonts(): void {
  if (registered) return;

  Font.register({
    family: "Fraunces",
    fonts: [
      { src: fontPath("fraunces-300.woff"), fontWeight: 300 },
      { src: fontPath("fraunces-400.woff"), fontWeight: 400 },
      { src: fontPath("fraunces-500.woff"), fontWeight: 500 },
      { src: fontPath("fraunces-600.woff"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Inter",
    fonts: [
      { src: fontPath("inter-300.woff"), fontWeight: 300 },
      { src: fontPath("inter-400.woff"), fontWeight: 400 },
      { src: fontPath("inter-500.woff"), fontWeight: 500 },
    ],
  });

  // Keep hyphenation from chopping ingredient names oddly.
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

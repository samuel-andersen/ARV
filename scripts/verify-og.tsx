/**
 * Verifies the OG share card renders with the vendored woff fonts (the main
 * risk: satori must accept .woff). Run:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/verify-og.tsx
 */
import { ImageResponse } from "next/og";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const fraunces = readFileSync(join(process.cwd(), "assets/fonts/fraunces-400.woff"));
  const inter = readFileSync(join(process.cwd(), "assets/fonts/inter-500.woff"));

  const res = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#E3EAE4",
          padding: "72px 80px",
        }}
      >
        <div style={{ fontFamily: "Inter", fontSize: 22, color: "#49604F" }}>ARV</div>
        <div style={{ fontFamily: "Fraunces", fontSize: 76, color: "#141413" }}>
          Grandmother&apos;s Cardamom Buns
        </div>
        <div style={{ fontFamily: "Inter", fontSize: 20, color: "#6F6F6C" }}>
          From scroll to shelf · arv.kitchen
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
    },
  );

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync("scripts/arv-og-verify.png", buf);
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  console.log(`OG image: ${buf.length} bytes, PNG header: ${isPng}`);
}

main().catch((e) => {
  console.error("OG render failed:", e.message);
  process.exit(1);
});

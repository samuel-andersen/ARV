import QRCode from "qrcode";

/**
 * A small, real QR back to the source post — the handoff's "Skann for å se
 * innlegget det kom fra". Rendered server-side to Ink-on-transparent SVG so it
 * sits on any surface. Returns null if the URL can't be encoded.
 */
export async function SourceQr({ url }: { url: string }) {
  let svg: string;
  try {
    svg = await QRCode.toString(url, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#141413", light: "#00000000" },
    });
  } catch {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-14 w-14 shrink-0 [&>svg]:h-full [&>svg]:w-full"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span className="text-[11px] font-light leading-snug text-stone">
        Skann for å se
        <br />
        innlegget det kom fra
      </span>
    </div>
  );
}

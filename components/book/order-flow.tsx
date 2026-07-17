"use client";

import { useState, useTransition } from "react";
import { orderBook } from "@/lib/actions/books";
import { orderTotal, kr, MAX_COPIES } from "@/lib/book/pricing";
import { tapHaptic, okHaptic, alertHaptic } from "@/lib/haptics";

/**
 * The order climax — a transparent checkout instead of a one-tap buy. Shows the
 * exact spec, a live price breakdown that reacts to the copy count, recipient
 * details, and an honest "what happens next". Price is recomputed and enforced
 * server-side; this is only the presentation.
 */
export function OrderFlow({ bookId, pageCount }: { bookId: string; pageCount: number }) {
  const [open, setOpen] = useState(false);
  const [copies, setCopies] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gift, setGift] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const price = orderTotal(pageCount, copies);

  function submit() {
    setError(null);
    if (!name.trim()) return setError("Fyll inn navnet på mottakeren.");
    if (address.trim().length < 8) return setError("Fyll inn en fullstendig leveringsadresse.");
    okHaptic();
    startTransition(async () => {
      const res = await orderBook(bookId, {
        copies,
        recipientName: name,
        recipientAddress: address,
        giftNote: gift,
      });
      if (res?.error) {
        alertHaptic();
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          setOpen(true);
        }}
        className="tap w-full bg-gran px-5 py-[15px] text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
      >
        Bestill · fra {kr(price.unit)}
      </button>

      {open && (
        <div
          className="scrim-in fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="sheet-up max-h-[90dvh] w-full max-w-md overflow-y-auto bg-papir px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:max-h-[88vh] sm:border sm:border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
                  Fullfør bestillingen
                </span>
                <h2 className="serif mt-1.5 text-[24px] font-normal leading-tight text-ink">
                  Din bok, trykt
                </h2>
                <p className="mt-1.5 text-[12.5px] font-light text-stone">
                  Innbundet i lin · 20 × 25 cm · {pageCount} sider
                </p>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="tap -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-stone hover:text-ink"
                aria-label="Lukk"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* Copies */}
            <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
              <div>
                <div className="text-[13.5px] text-ink">Antall eksemplarer</div>
                <div className="mt-0.5 text-[11.5px] font-light text-stone">{kr(price.unit)} per bok</div>
              </div>
              <div className="flex items-center gap-1">
                <Stepper label="Færre" disabled={copies <= 1} onClick={() => { tapHaptic(); setCopies((c) => Math.max(1, c - 1)); }}>−</Stepper>
                <span className="serif w-9 text-center text-[18px] tabular-nums text-ink">{copies}</span>
                <Stepper label="Flere" disabled={copies >= MAX_COPIES} onClick={() => { tapHaptic(); setCopies((c) => Math.min(MAX_COPIES, c + 1)); }}>+</Stepper>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
              <label className="flex flex-col gap-1">
                <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">Mottaker</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Navn"
                  autoComplete="name"
                  className="border border-line bg-snow px-3 py-2.5 text-[16px] text-ink outline-none focus:border-gran"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">Leveringsadresse</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Gate, postnummer og sted"
                  autoComplete="street-address"
                  className="resize-none border border-line bg-snow px-3 py-2.5 text-[15px] font-light text-ink outline-none focus:border-gran"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">Hilsen i gave (valgfritt)</span>
                <input
                  value={gift}
                  onChange={(e) => setGift(e.target.value)}
                  placeholder="Trykkes på et kort i pakken"
                  className="border border-line bg-snow px-3 py-2.5 text-[15px] font-light text-ink outline-none focus:border-gran"
                />
              </label>
            </div>

            {/* Price breakdown */}
            <div className="mt-5 flex flex-col gap-1.5 border-t border-line pt-5 text-[13px]">
              <Row label={`${copies} × bok`} value={kr(price.goods)} />
              <Row label="Frakt · Posten" value={kr(price.shipping)} />
              <div className="mt-1.5 flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-[14px] font-medium text-ink">Totalt</span>
                <span className="serif text-[18px] text-ink tabular-nums">{kr(price.total)}</span>
              </div>
            </div>

            {error && <p className="mt-3 text-[12.5px] font-light text-negative">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="tap mt-5 w-full bg-gran px-5 py-[15px] text-[13px] font-medium text-snow transition-opacity hover:opacity-85 disabled:opacity-70"
            >
              {pending ? "Sender bestillingen…" : `Bestill · ${kr(price.total)}`}
            </button>
            <p className="mt-3 text-center text-[11px] font-light leading-relaxed text-stone">
              Ingen betaling nå — vi bekrefter på e-post før trykk.<br />
              Trykket og sydd i Norge · levering 7–10 dager.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tap flex h-11 w-11 items-center justify-center border border-line text-lg text-gran hover:border-gran disabled:text-fog disabled:hover:border-line"
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-light text-stone">{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}

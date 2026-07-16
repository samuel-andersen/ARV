"use client";

import { useState, useTransition } from "react";
import { addNote } from "@/lib/actions/notes";
import { okHaptic, tapHaptic } from "@/lib/haptics";
import type { RecipeNote } from "@/lib/data/recipes";

const LABEL = "text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone";

function fmtDate(iso: string): string {
  const months = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];
  const d = new Date(iso);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * "Mine notater" — the user's margin notes, set in italic serif on Papir with a
 * Salvie edge and a signature, exactly as they'll be printed in the book.
 */
export function RecipeNotes({
  recipeId,
  notes,
}: {
  recipeId: string;
  notes: RecipeNote[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    const text = draft.trim();
    if (!text) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await addNote(recipeId, text);
      if (res.error) setError(res.error);
      else {
        okHaptic();
        setDraft("");
        setOpen(false);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={LABEL}>Mine notater</span>
        <button
          type="button"
          onClick={() => {
            tapHaptic();
            setOpen((o) => !o);
          }}
          className="tap border-b border-salvie pb-0.5 text-xs font-medium text-gran transition-colors hover:border-gran"
        >
          {open ? "Lukk" : "+ Nytt notat"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {notes.map((n) => (
          <div key={n.id} className="border-l-2 border-salvie bg-papir px-3.5 py-3">
            <p className="serif-italic text-[13.5px] font-light leading-relaxed text-ink">
              {n.body}
            </p>
            <p className="mt-1.5 text-[10.5px] font-light text-stone">
              — {n.authorName ?? "Du"}, {fmtDate(n.created_at)}
            </p>
          </div>
        ))}

        {open && (
          <div className="border border-line bg-snow">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              placeholder="F.eks. «Bruk 3 ss kardemomme — 2 er for lite for oss»"
              className="serif-italic min-h-[64px] w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px] leading-relaxed text-ink placeholder:not-italic placeholder:text-stone/70 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 px-2.5 pb-2.5">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="tap bg-gran px-5 py-2.5 text-xs font-medium text-snow transition-opacity hover:opacity-85"
              >
                {pending ? "Lagrer…" : "Lagre notat"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs font-light text-negative">{error}</p>}

        <p className="text-[11px] font-light leading-relaxed text-stone">
          Notatene trykkes i margen på boksiden — og boken får egne linjeark til å skrive videre på.
        </p>
      </div>
    </div>
  );
}

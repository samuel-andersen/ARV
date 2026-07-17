"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteContributor, removeContributor } from "@/lib/actions/books";
import { joinNames } from "@/lib/book/labels";
import { tapHaptic, okHaptic } from "@/lib/haptics";
import type { FamilyMember } from "@/lib/data/books";

function firstName(m: FamilyMember): string {
  const n = m.name?.trim().split(/\s+/)[0];
  if (n) return n;
  const local = m.email?.split("@")[0];
  return local ? local[0].toUpperCase() + local.slice(1) : "Ny";
}

function Avatar({ member }: { member: FamilyMember }) {
  const initial = firstName(member)[0]?.toUpperCase() ?? "A";
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 56 }}>
      <div className={`h-11 w-11 overflow-hidden bg-salvie ${member.accepted ? "" : "opacity-45"}`}>
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" decoding="async" />
        ) : (
          <span className="serif flex h-full w-full items-center justify-center text-[17px] text-gran">
            {initial}
          </span>
        )}
      </div>
      <span className="w-full truncate text-center text-[10.5px] font-light text-stone">
        {member.isOwner ? "Deg" : firstName(member)}
      </span>
    </div>
  );
}

/**
 * "Familien rundt boken" — the emotional core of Arv, made visible. Everyone
 * gathered around a book is shown up front (owner + contributors), and the
 * owner is warmly invited to bring in the people who actually cooked the food.
 * Arv means what is passed on; a book grows richest together.
 */
export function BookFamily({
  bookId,
  family,
  isOwner,
  ownerName,
}: {
  bookId: string;
  family: FamilyMember[];
  isOwner: boolean;
  ownerName: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accepted = family.filter((m) => m.accepted);
  const pending_ = family.filter((m) => !m.accepted);
  const others = accepted.filter((m) => !m.isOwner).map(firstName);

  function invite() {
    setError(null);
    const value = email.trim();
    if (!value) return;
    tapHaptic();
    startTransition(async () => {
      const res = await inviteContributor(bookId, value);
      if (res?.error) setError(res.error);
      else {
        okHaptic();
        setEmail("");
        router.refresh();
      }
    });
  }

  function remove(mEmail: string) {
    tapHaptic();
    startTransition(async () => {
      await removeContributor(bookId, mEmail);
      router.refresh();
    });
  }

  const headline = isOwner
    ? others.length
      ? `Du og ${joinNames(others)} samler denne boken.`
      : "Denne boken er din — men arv blir til sammen."
    : `Du bidrar til ${ownerName ? `${ownerName}s` : "en delt"} bok.`;

  return (
    <section className="border border-line bg-snow p-5 sm:p-6">
      <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
        Familien rundt boken
      </span>
      <h2 className="serif mt-2 text-[19px] font-normal leading-snug text-ink" style={{ textWrap: "pretty" }}>
        {headline}
      </h2>

      {/* Faces */}
      <div className="mt-4 flex flex-wrap gap-x-2 gap-y-3">
        {accepted.map((m) => (
          <Avatar key={m.userId ?? m.email ?? "owner"} member={m} />
        ))}
        {pending_.map((m) => (
          <Avatar key={m.email ?? m.userId} member={m} />
        ))}
      </div>

      {isOwner && (
        <div className="mt-5 border-t border-line pt-5">
          <p className="serif-italic text-[13.5px] font-light leading-relaxed text-gran">
            Inviter dem som lagde maten — mor, bestemor, en venn.
          </p>
          <p className="mt-1 text-[12.5px] font-light text-stone">
            De legger til sine egne oppskrifter, med sin historie og signatur, i denne boken.
          </p>

          <div className="mt-3 flex gap-2">
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="navn@eksempel.no"
              aria-label="E-post til den du vil invitere"
              className="min-w-0 flex-1 border border-line bg-snow px-3 py-2.5 text-[16px] text-ink placeholder:text-stone/70 focus:border-gran focus:outline-none"
            />
            <button
              type="button"
              onClick={invite}
              disabled={pending || !email.trim()}
              className="tap shrink-0 bg-gran px-5 text-[13px] font-medium text-snow transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Sender…" : "Inviter"}
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] font-light text-negative">{error}</p>}

          {pending_.length > 0 && (
            <ul className="mt-4 flex flex-col gap-px">
              {pending_.map((m) => (
                <li
                  key={m.email ?? m.userId}
                  className="flex items-center justify-between border-b border-line py-2 text-[12.5px]"
                >
                  <span className="font-light text-stone">
                    {m.email}
                    <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-stone/70">Invitert</span>
                  </span>
                  {m.email && (
                    <button
                      type="button"
                      onClick={() => remove(m.email!)}
                      disabled={pending}
                      className="tap flex h-8 w-8 items-center justify-center text-stone hover:text-negative"
                      aria-label={`Trekk tilbake invitasjonen til ${m.email}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

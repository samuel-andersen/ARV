"use client";

import { useActionState } from "react";
import { signInWithEmail, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Eyebrow } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signInWithEmail,
    {},
  );

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.34em] text-ink">ARV</span>
      <h1 className="serif mt-6 text-[36px] font-normal leading-tight text-ink">
        Begynn å samle.
      </h1>
      <p className="serif-italic mt-3 text-[15px] font-light leading-relaxed text-gran">
        Fra feed til familiearv.
      </p>
      <p className="mt-4 font-light text-stone">
        Vi sender deg en lenke på e-post — ingen passord å huske.
      </p>

      {state.sent ? (
        <div className="mt-10 border border-line bg-salvie p-6">
          <Eyebrow onSalvie>Sjekk e-posten</Eyebrow>
          <p className="mt-3 font-light text-gran">
            En innloggingslenke er på vei. Åpne den på denne enheten for å fortsette.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-10 flex flex-col gap-6">
          <Field label="E-post" htmlFor="email" error={state.error}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="deg@eksempel.no"
              required
            />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Sender…" : "Send meg en lenke"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-xs font-light text-stone">
        Innlogging med Google kommer snart.
      </p>
    </main>
  );
}

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Eyebrow>Arv · arv.kitchen</Eyebrow>
      <h1 className="mt-6 text-4xl font-light leading-tight text-ink">
        Start collecting.
      </h1>
      <p className="mt-4 font-light text-stone">
        From scroll to shelf. We&apos;ll email you a link — no password to
        remember.
      </p>

      {state.sent ? (
        <div className="mt-10 border border-line bg-mist p-6">
          <Eyebrow>Check your email</Eyebrow>
          <p className="mt-3 font-light text-ink">
            A sign-in link is on its way. Open it on this device to continue.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-10 flex flex-col gap-6">
          <Field label="Email" htmlFor="email" error={state.error}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Email me a link"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-xs font-light text-stone">
        Google sign-in arrives soon.
      </p>
    </main>
  );
}

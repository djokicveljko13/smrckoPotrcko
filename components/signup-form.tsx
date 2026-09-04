"use client";

import { useActionState } from "react";
import { signUp, type SignUpState } from "@/app/actions/auth";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signUp,
    null as SignUpState,
  );

  // Uspeh bez sesije = Supabase i dalje traži potvrdu mejla. Tada forma ostaje
  // na ekranu sa uputstvom; kad sesija postoji, server je već odredirektovao.
  const needsConfirm = state && "ok" in state && state.needsConfirm;

  if (needsConfirm) {
    return (
      <p className="mt-8 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-semibold">
        Nalog je napravljen. Otvori mejl i klikni na link za potvrdu, pa se
        prijavi.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="code" className={labelClass}>
          Pozivni kod
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          autoComplete="off"
          autoFocus
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Lozinka
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password2" className={labelClass}>
          Ponovi lozinku
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>

      {state && "error" in state ? (
        <p
          className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Pravim nalog…" : "Napravi nalog"}
      </button>
    </form>
  );
}

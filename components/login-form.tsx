"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signIn,
    null as SignInState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
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
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>

      {state?.error ? (
        <p
          className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Prijavljujem…" : "Prijavi se"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    null as ChangePasswordState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="currentPassword" className={labelClass}>
          Trenutna lozinka
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className={labelClass}>
          Nova lozinka
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          aria-describedby="newPasswordHint"
          className={fieldClass}
        />
        <p id="newPasswordHint" className="mt-1.5 text-sm text-zinc-500">
          Najmanje {MIN_PASSWORD_LENGTH} znakova.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Ponovi novu lozinku
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
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

      {state && "ok" in state ? (
        <p
          className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          role="status"
        >
          Lozinka je promenjena. Ostali uređaji su odjavljeni.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Menjam…" : "Promeni lozinku"}
      </button>
    </form>
  );
}

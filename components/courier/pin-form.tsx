"use client";

import { useActionState } from "react";
import {
  courierLogin,
  type CourierLoginState,
} from "@/app/actions/courier";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function CourierPinForm({
  token,
  courierName,
}: {
  token: string;
  courierName: string;
}) {
  const [state, formAction, pending] = useActionState(
    courierLogin.bind(null, token),
    null as CourierLoginState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <p className="text-sm font-semibold text-zinc-600">
        Zdravo, {courierName}. Unesi PIN koji ti je vlasnik dao.
      </p>

      <div>
        <label htmlFor="pin" className={labelClass}>
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,8}"
          maxLength={8}
          required
          autoComplete="one-time-code"
          autoFocus
          className={`${fieldClass} tracking-[0.4em]`}
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
        {pending ? "Proveravam…" : "Otvori"}
      </button>
    </form>
  );
}

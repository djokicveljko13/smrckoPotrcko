"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCourier, type CourierFormState } from "@/app/actions/couriers";

/*
 * Nov kurir nema id, pa akciji ne treba nista van forme — otud nema .bind().
 * PIN bira vlasnik i diktira ga kuriru, zato je polje type=text (mora da vidi
 * sta kuca). Link kurira se ne unosi: access_token pravi baza pri insertu.
 */
export function CourierCreateForm() {
  const [state, formAction, pending] = useActionState(
    createCourier,
    null as CourierFormState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  // Posle uspesnog dodavanja isprazni polja, da vlasnik ne doda istog kurira
  // dvaput i da odmah moze da kuca sledeceg.
  useEffect(() => {
    if (state && "ok" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border-2 border-zinc-200 bg-white p-4"
    >
      <p className="font-display text-lg font-extrabold">Dodaj kurira</p>
      <p className="mt-1 text-sm text-zinc-500">
        PIN biraš ti i kažeš ga kuriru. Link dobija posle dodavanja.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="text-xs font-bold text-zinc-500">Ime</span>
          <input
            name="name"
            required
            placeholder="Marko Marković"
            className="w-full rounded-lg border-2 border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand"
          />
        </label>

        <label>
          <span className="text-xs font-bold text-zinc-500">Telefon</span>
          <input
            name="phone"
            required
            placeholder="0641234567"
            className="w-full rounded-lg border-2 border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand"
          />
        </label>

        <label>
          <span className="text-xs font-bold text-zinc-500">PIN</span>
          <input
            name="pin"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4,8}"
            maxLength={8}
            required
            placeholder="4–8 cifara"
            className="w-full rounded-lg border-2 border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand"
          />
        </label>
      </div>

      {state && "error" in state ? (
        <p className="mt-2 text-sm font-semibold text-brand-dark" role="alert">
          {state.error}
        </p>
      ) : null}

      {state && "ok" in state ? (
        <p className="mt-2 text-sm font-semibold text-emerald-700">
          Kurir je dodat. Link mu je ispod — pošalji ga i reci mu PIN.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-xl bg-brand px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Dodajem…" : "Dodaj kurira"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  createGuestOrder,
  type CreateGuestOrderState,
} from "@/app/actions/create-guest-order";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { DeliveryAnimation, ORBIT_MS } from "@/components/delivery-animation";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function GuestOrderForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createGuestOrder,
    null as CreateGuestOrderState,
  );

  const startedAt = useRef(0);

  /*
   * "Da li se šalje" se NE čuva u useState — izračuna se iz onoga što već znamo:
   *   pending            -> server još radi
   *   status === "ok"    -> server je gotov, ali još čekamo da krug istekne
   *   status === "error" -> sakrij overlay i pokaži grešku
   * Manje stanja = manje prilika da se dva stanja raziđu.
   */
  const sending = pending || state?.status === "ok";

  /*
   * Server i animacija su dve nezavisne trke i ne znamo koja se prva završi.
   * Zato ne navigiramo ni na jednu od njih posebno, nego na OBE:
   *
   *   - upis traje 300ms, krug 2600ms  -> čekamo još 2300ms da krug ne pukne
   *   - upis traje 4000ms, krug 2600ms -> čekamo 0ms, auto se vrteo duže
   *
   * Zato je animacija "infinite": ako server kasni, auto samo nastavi da kruži
   * umesto da se ukoči na pola ekrana.
   */
  useEffect(() => {
    if (state?.status !== "ok") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const elapsed = Date.now() - startedAt.current;
    const wait = reducedMotion ? 0 : Math.max(0, ORBIT_MS - elapsed);

    const target =
      `/hvala?broj=${encodeURIComponent(state.ticket)}` +
      (state.price !== null ? `&cena=${state.price}` : "");

    const timer = setTimeout(() => router.push(target), wait);
    return () => clearTimeout(timer);
  }, [state, router]);

  return (
    <>
      {/* Overlay ostaje na ekranu i posle push-a, da ne bljesne forma pre /hvala. */}
      {sending ? <DeliveryAnimation /> : null}

      {/*
        Vreme starta hvatamo na submit, ne u efektu: onSubmit se okine tačno u
        trenutku klika, a i preskače se sam ako browser obori validaciju polja —
        tada nema ni animacije ni slanja, što je i logično.
      */}
      <form
        action={formAction}
        onSubmit={() => {
          startedAt.current = Date.now();
        }}
        className="mt-4 space-y-3 sm:mt-5 sm:space-y-4"
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            Šta ti treba?
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={500}
            className={fieldClass}
            placeholder="pizza"
          />
        </div>

        <div>
          <label htmlFor="shop" className={labelClass}>
            Iz koje radnje?
          </label>
          <input
            id="shop"
            name="shop"
            required
            maxLength={300}
            className={fieldClass}
            placeholder="npr. Maxi kod pijace"
          />
        </div>

        <AddressAutocomplete />

        <div>
          <label htmlFor="phone" className={labelClass}>
            Tvoj telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={40}
            autoComplete="tel"
            className={fieldClass}
            placeholder="06x xxx xxxx"
          />
        </div>

        {state?.status === "error" ? (
          <p
            className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || sending}
          className={primaryButtonClass}
        >
          {pending || sending ? "Šaljem…" : "Pošalji porudžbinu"}
        </button>
      </form>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createGuestOrder } from "@/app/actions/create-guest-order";
import { prepareGuestOrder } from "@/app/actions/prepare-guest-order";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { OrderConfirmation } from "@/components/order-confirmation";
import { ORBIT_MS } from "@/components/delivery-animation";
import { PackageIcon, PhoneIcon } from "@/components/icons";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import type { CreateGuestOrderState, PrepareOrderResult } from "@/lib/order-types";
import { fieldClass, fieldIconClass, fieldWithIconClass, labelClass, primaryButtonClass } from "@/lib/ui";

export function GuestOrderForm() {
  const router = useRouter();
  const [prepared, setPrepared] = useState<Extract<PrepareOrderResult, { status: "ok" }> | null>(null);
  const [prepareError, setPrepareError] = useState<Extract<PrepareOrderResult, { status: "error" }> | null>(null);
  const [state, setState] = useState<CreateGuestOrderState>(null);
  const [phase, setPhase] = useState<"idle" | "quoting" | "confirming" | "success">("idle");
  const submitRef = useRef<HTMLButtonElement>(null);
  const lastInput = useRef<FormData | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const startedAt = useRef(0);
  const sending = phase === "confirming" || phase === "success";

  useEffect(() => () => { revision.current += 1; }, []);

  useEffect(() => {
    if (state?.status !== "ok") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = Date.now() - startedAt.current;
    const wait = reducedMotion ? 0 : Math.max(0, ORBIT_MS - elapsed);
    const timer = setTimeout(() => router.push(`/hvala?broj=${encodeURIComponent(state.ticket)}&cena=${state.price}`), wait);
    return () => clearTimeout(timer);
  }, [state, router]);

  async function prepare(input: FormData) {
    if (busy.current) return;
    busy.current = true; // Ref zaključava i drugi klik pre sledećeg React rendera.
    const currentRevision = ++revision.current;
    lastInput.current = input;
    setPhase("quoting");
    setPrepareError(null);
    setState(null);
    try {
      const result = await prepareGuestOrder(input);
      if (currentRevision !== revision.current) return;
      if (result.status === "ok") setPrepared(result);
      else setPrepareError(result);
    } catch {
      if (currentRevision !== revision.current) return;
      setPrepareError({ status: "error", message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi." });
    } finally {
      if (currentRevision === revision.current) {
        busy.current = false;
        setPhase("idle");
      }
    }
  }

  function closePreview() {
    if (busy.current) return;
    revision.current += 1;
    setPrepared(null);
    setPrepareError(null);
    setState(null);
    lastInput.current = null;
    // Dialog se prvo uklanja, pa fokus vraćamo na dugme u formi.
    requestAnimationFrame(() => submitRef.current?.focus({ preventScroll: true }));
  }

  async function confirm() {
    if (busy.current || !prepared) return;
    if (Date.now() >= prepared.quote.expiresAt) {
      setState({ status: "error", message: "Cena je istekla. Ponovo proveri cenu.", expired: true });
      return;
    }
    busy.current = true;
    setPhase("confirming");
    setState(null);
    setPrepareError(null);
    startedAt.current = Date.now();
    try {
      const result = await createGuestOrder(prepared.token);
      setState(result);
      if (result.status === "ok") {
        setPhase("success");
        return; // Ostaje zaključano i tokom prelaska na /hvala.
      }
    } catch {
      setState({ status: "error", message: "Slanje nije potvrđeno. Pozovi nas da proverimo porudžbinu pre ponovnog slanja." });
    }
    busy.current = false;
    setPhase("idle");
  }

  const fields = prepareError?.fields;
  return (
    <>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!busy.current) void prepare(new FormData(event.currentTarget));
      }} className="mt-4 sm:mt-5" aria-busy={phase !== "idle"}>
        <fieldset disabled={phase !== "idle"} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="title" className={labelClass}>Šta da ti donesemo?</label>
            <div className="relative mt-1.5">
              <span className={fieldIconClass}><PackageIcon /></span>
              <input id="title" name="title" required maxLength={500} className={fieldWithIconClass}
                aria-invalid={Boolean(fields?.title)} aria-describedby={fields?.title ? "title-error" : undefined}
                placeholder="Npr. 2 pice, lek iz apoteke, namirnice…" />
            </div>
            {fields?.title ? <p id="title-error" className="mt-1 text-xs text-brand-dark">{fields.title}</p> : null}
          </div>
          <AddressAutocomplete name="shop" label="Odakle preuzimamo?" placeholder="Ulica i broj ili naziv radnje" maxLength={300} error={fields?.shop} />
          <AddressAutocomplete error={fields?.address} />
          <div>
            <label htmlFor="address_details" className={labelClass}>Sprat, stan, ulaz <span className="font-medium text-zinc-500">(opciono)</span></label>
            <input id="address_details" name="address_details" maxLength={150} className={fieldClass}
              placeholder="Npr. ulaz B, 2. sprat, stan 8" aria-invalid={Boolean(fields?.address_details)}
              aria-describedby={fields?.address_details ? "details-error" : undefined} />
            {fields?.address_details ? <p id="details-error" className="mt-1 text-xs text-brand-dark">{fields.address_details}</p> : null}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Broj telefona</label>
            <div className="relative mt-1.5">
              <span className={fieldIconClass}><PhoneIcon /></span>
              <input id="phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={fieldWithIconClass}
                aria-invalid={Boolean(fields?.phone)} aria-describedby={fields?.phone ? "phone-error" : undefined} placeholder="06x xxx xxxx" />
            </div>
            {fields?.phone ? <p id="phone-error" className="mt-1 text-xs text-brand-dark">{fields.phone}</p> : null}
          </div>
          {prepareError && !prepared ? (
            <p role="alert" className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
              {prepareError.message} <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>
            </p>
          ) : null}
          <button ref={submitRef} type="submit" disabled={phase !== "idle"} className={primaryButtonClass}>
            {phase === "quoting" ? "Računam cenu…" : sending ? "Šaljem…" : "Poruči"}
          </button>
          <p className="text-center text-xs font-medium leading-snug text-zinc-500">Prvo proveri cenu dostave, pa potvrdi porudžbinu.</p>
        </fieldset>
      </form>
      {prepared ? <OrderConfirmation key={prepared.token} quote={prepared.quote} calculating={phase === "quoting"} sending={sending}
        invalidQuote={state?.status === "error" && Boolean(state.expired)}
        error={prepareError?.message ?? (state?.status === "error" ? state.message : undefined)}
        onClose={closePreview} onConfirm={() => void confirm()}
        onReprice={() => { if (lastInput.current) void prepare(lastInput.current); }} /> : null}
    </>
  );
}

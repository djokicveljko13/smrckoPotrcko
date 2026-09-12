"use client";

import { useEffect, useRef, useState } from "react";
import { createPhoneOrder } from "@/app/actions/create-phone-order";
import { prepareGuestOrder } from "@/app/actions/prepare-guest-order";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CourierNoteField } from "@/components/courier-note-field";
import { OrderConfirmation } from "@/components/order-confirmation";
import { PackageIcon, PhoneIcon } from "@/components/icons";
import { ADDRESS_DETAILS_LABEL } from "@/lib/labels";
import { deliveryPriceLabel } from "@/lib/pricing";
import type { CreateGuestOrderState, PrepareOrderResult } from "@/lib/order-types";
import { fieldClass, fieldIconClass, fieldWithIconClass, labelClass, primaryButtonClass } from "@/lib/ui";

/**
 * Ista polja i isti obračun kao javna forma. Posle potvrde ostajemo ovde:
 * vlasnik pročita broj kupcu na vezi, pa može odmah sledeći poziv.
 */
export function PhoneOrderForm() {
  const [formKey, setFormKey] = useState(0);
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [shopChosen, setShopChosen] = useState(false);
  const [addressChosen, setAddressChosen] = useState(false);
  const [prepared, setPrepared] = useState<Extract<PrepareOrderResult, { status: "ok" }> | null>(null);
  const [prepareError, setPrepareError] = useState<Extract<PrepareOrderResult, { status: "error" }> | null>(null);
  const [state, setState] = useState<CreateGuestOrderState>(null);
  const [phase, setPhase] = useState<"idle" | "quoting" | "confirming">("idle");
  const submitRef = useRef<HTMLButtonElement>(null);
  const lastInput = useRef<FormData | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const canQuote = title.trim() !== "" && phone.trim() !== "" && shopChosen && addressChosen;

  useEffect(() => () => { revision.current += 1; }, []);

  async function prepare(input: FormData) {
    if (busy.current) return;
    busy.current = true;
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
      setPrepareError({ status: "error", message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo." });
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
    try {
      const result = await createPhoneOrder(prepared.token);
      setState(result);
      if (result.status === "ok") {
        setPrepared(null);
        setTitle("");
        setPhone("");
        setShopChosen(false);
        setAddressChosen(false);
        setFormKey((key) => key + 1);
        lastInput.current = null;
      }
    } catch {
      setState({ status: "error", message: "Porudžbina nije upisana. Pokušaj ponovo." });
    }
    busy.current = false;
    setPhase("idle");
  }

  const fields = prepareError?.fields;
  const sending = phase === "confirming";

  return (
    <>
      {state?.status === "ok" ? (
        <p role="status" className="mb-4 rounded-2xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-ink">
          Upisano {state.ticket}. Cena dostave {deliveryPriceLabel(state.price)}.
          Pročitaj broj kupcu ako zatreba — kurir je obavešten ako je na smeni.
        </p>
      ) : null}
      <form
        key={formKey}
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy.current && canQuote) void prepare(new FormData(event.currentTarget));
        }}
        className="space-y-3 sm:space-y-4"
        aria-busy={phase !== "idle"}
      >
        <fieldset disabled={phase !== "idle"} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="title" className={labelClass}>Šta donosimo?</label>
            <div className="relative mt-1.5">
              <span className={fieldIconClass}><PackageIcon /></span>
              <input id="title" name="title" required maxLength={500} className={fieldWithIconClass}
                value={title} onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(fields?.title)} aria-describedby={fields?.title ? "title-error" : undefined}
                placeholder="Npr. 2 pice, lek iz apoteke…" />
            </div>
            {fields?.title ? <p id="title-error" className="mt-1 text-xs text-brand-dark">{fields.title}</p> : null}
          </div>
          <AddressAutocomplete name="shop" label="Odakle preuzimamo?" placeholder="Ulica i broj ili naziv radnje" maxLength={300} error={fields?.shop} onSelect={setShopChosen} />
          <AddressAutocomplete error={fields?.address} onSelect={setAddressChosen} />
          <div>
            <label htmlFor="address_details" className={labelClass}>{ADDRESS_DETAILS_LABEL} <span className="font-medium text-zinc-500">(opciono)</span></label>
            <input id="address_details" name="address_details" maxLength={150} className={fieldClass}
              placeholder="Npr. ulaz B, 2. sprat, stan 8" aria-invalid={Boolean(fields?.address_details)}
              aria-describedby={fields?.address_details ? "details-error" : undefined} />
            {fields?.address_details ? <p id="details-error" className="mt-1 text-xs text-brand-dark">{fields.address_details}</p> : null}
          </div>
          <CourierNoteField error={fields?.note} />
          <div>
            <label htmlFor="phone" className={labelClass}>Telefon kupca</label>
            <div className="relative mt-1.5">
              <span className={fieldIconClass}><PhoneIcon /></span>
              <input id="phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" className={fieldWithIconClass}
                value={phone} onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(fields?.phone)} aria-describedby={fields?.phone ? "phone-error" : undefined} placeholder="06x xxx xxxx" />
            </div>
            {fields?.phone ? <p id="phone-error" className="mt-1 text-xs text-brand-dark">{fields.phone}</p> : null}
          </div>
          {prepareError && !prepared ? (
            <p role="alert" className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
              {prepareError.message}
            </p>
          ) : null}
          <button ref={submitRef} type="submit" disabled={phase !== "idle" || !canQuote} className={primaryButtonClass}>
            {phase === "quoting" ? "Računam cenu…" : sending ? "Šaljem…" : "Proveri cenu"}
          </button>
          <p className="text-center text-xs font-medium leading-snug text-zinc-500">
            Prvo vidi cenu, pa potvrdi. Kurir dobija Telegram kao i za porudžbinu sa sajta.
          </p>
        </fieldset>
      </form>
      {prepared ? (
        <OrderConfirmation
          key={prepared.token}
          quote={prepared.quote}
          calculating={phase === "quoting"}
          sending={sending}
          invalidQuote={state?.status === "error" && Boolean(state.expired)}
          error={prepareError?.message ?? (state?.status === "error" ? state.message : undefined)}
          onClose={closePreview}
          onConfirm={() => void confirm()}
          onReprice={() => { if (lastInput.current) void prepare(lastInput.current); }}
        />
      ) : null}
    </>
  );
}

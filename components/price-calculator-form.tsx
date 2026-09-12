"use client";

import { useRef, useState } from "react";
import { estimateGuestDeliveryPrice } from "@/app/actions/estimate-delivery-price";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { saveDraftPlaces } from "@/lib/order-draft";
import { deliveryPriceLabel } from "@/lib/pricing";
import type { PriceEstimateResult } from "@/lib/price-estimate";
import { primaryButtonClass } from "@/lib/ui";

/**
 * Samo dve adrese. Cenu i dalje računa server — browser ne sme da zna formulu
 * ni da šalje izmišljen `placeId`, jer bi tada svako mogao da sebi smanji cenu.
 */
export function PriceCalculatorForm() {
  const [shopChosen, setShopChosen] = useState(false);
  const [addressChosen, setAddressChosen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "quoting">("idle");
  const [result, setResult] = useState<Extract<PriceEstimateResult, { status: "ok" }> | null>(null);
  const [error, setError] = useState<Extract<PriceEstimateResult, { status: "error" }> | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const canQuote = shopChosen && addressChosen;

  function clearEstimate() {
    setResult(null);
    setError(null);
  }

  async function estimate(input: FormData) {
    if (busy.current) return;
    busy.current = true;
    const currentRevision = ++revision.current;
    setPhase("quoting");
    setError(null);
    setResult(null);
    try {
      const next = await estimateGuestDeliveryPrice(input);
      if (currentRevision !== revision.current) return;
      if (next.status === "ok") setResult(next);
      else setError(next);
    } catch {
      if (currentRevision !== revision.current) return;
      setError({
        status: "error",
        message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi.",
      });
    } finally {
      if (currentRevision === revision.current) {
        busy.current = false;
        setPhase("idle");
      }
    }
  }

  const fields = error?.fields;

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy.current && canQuote) void estimate(new FormData(event.currentTarget));
      }}
      className="space-y-3 sm:space-y-4"
      aria-busy={phase !== "idle"}
    >
      <fieldset disabled={phase !== "idle"} className="space-y-3 sm:space-y-4">
        <AddressAutocomplete
          name="shop"
          label="Odakle preuzimamo?"
          placeholder="Ulica i broj ili naziv radnje"
          maxLength={300}
          error={fields?.shop}
          onSelect={(selected) => {
            setShopChosen(selected);
            clearEstimate();
          }}
        />
        <AddressAutocomplete
          error={fields?.address}
          onSelect={(selected) => {
            setAddressChosen(selected);
            clearEstimate();
          }}
        />
        {error && !result ? (
          <p role="alert" className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
            {error.message} <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>
          </p>
        ) : null}
        <button type="submit" disabled={phase !== "idle" || !canQuote} className={primaryButtonClass}>
          {phase === "quoting" ? "Računam cenu…" : "Izračunaj cenu"}
        </button>
      </fieldset>

      {result ? (
        <div className="rounded-2xl bg-brand/5 p-4" role="status">
          <p className="text-sm font-bold text-zinc-700">Cena dostave</p>
          <p className="mt-1 font-display text-4xl font-black italic text-brand">
            {deliveryPriceLabel(result.price)}
          </p>
          <dl className="mt-4 space-y-3 text-sm [overflow-wrap:anywhere]">
            <div>
              <dt className="text-xs font-bold text-zinc-500">Odakle preuzimamo</dt>
              <dd className="mt-0.5 font-semibold">{result.shop}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-zinc-500">Gde donosimo</dt>
              <dd className="mt-0.5 font-semibold">{result.address}</dd>
            </div>
          </dl>
          <a
            href="/#poruci"
            className="mt-4 inline-block text-sm font-bold text-brand underline underline-offset-4"
            onClick={() => {
              const form = formRef.current;
              if (!form) return;
              const data = new FormData(form);
              saveDraftPlaces({
                shop: String(data.get("shop") ?? ""),
                shopSelection: String(data.get("shop_selection") ?? ""),
                address: String(data.get("address") ?? ""),
                addressSelection: String(data.get("address_selection") ?? ""),
              });
            }}
          >
            Poruči ovu dostavu
          </a>
        </div>
      ) : null}
    </form>
  );
}

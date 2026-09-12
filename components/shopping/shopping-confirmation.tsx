"use client";

import { useEffect, useRef, useState } from "react";
import { DeliveryAnimation } from "@/components/delivery-animation";
import { ModalShell } from "@/components/modal-shell";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { ADDRESS_DETAILS_LABEL } from "@/lib/labels";
import { deliveryPriceLabel } from "@/lib/pricing";
import type { ShoppingQuote } from "@/lib/shopping-quote";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

type Props = {
  quote: ShoppingQuote;
  calculating: boolean;
  sending: boolean;
  error?: string;
  invalidQuote: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReprice: () => void;
};

export function ShoppingConfirmation({
  quote,
  calculating,
  sending,
  error,
  invalidQuote,
  onClose,
  onConfirm,
  onReprice,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [now, setNow] = useState(Date.now);
  const expired = invalidQuote || now >= quote.expiresAt;
  const locked = calculating || sending;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, quote.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [quote.expiresAt]);

  return (
    <ModalShell
      titleId="shopping-confirmation-title"
      descriptionId="shopping-confirmation-price"
      locked={locked}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border-2 border-zinc-100 bg-white p-5 text-ink shadow-2xl backdrop:bg-ink/60 sm:p-7"
    >
      {sending ? <DeliveryAnimation /> : null}
      <div inert={sending}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
          Još jedan korak
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          id="shopping-confirmation-title"
          className="mt-2 font-display text-2xl font-black italic uppercase outline-none sm:text-3xl"
        >
          Potvrdi kupovinu
        </h2>

        <div id="shopping-confirmation-price" className="mt-5 rounded-2xl bg-brand/5 p-4">
          <p className="text-sm font-bold text-zinc-700">Cena dostave</p>
          <p className="mt-1 font-display text-4xl font-black italic text-brand">
            {deliveryPriceLabel(quote.price)}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            {quote.storeLabel}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold text-zinc-500">Lista</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold [overflow-wrap:anywhere]">
            {quote.items.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ol>
        </div>

        <dl className="mt-5 space-y-3 text-sm [overflow-wrap:anywhere]">
          <div>
            <dt className="text-xs font-bold text-zinc-500">Market</dt>
            <dd className="mt-0.5 font-semibold">{quote.storeLabel}</dd>
          </div>
          {quote.note ? (
            <div>
              <dt className="text-xs font-bold text-zinc-500">Napomena</dt>
              <dd className="mt-0.5 whitespace-pre-wrap font-semibold">{quote.note}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-bold text-zinc-500">Gde donosimo</dt>
            <dd className="mt-0.5 font-semibold">{quote.address}</dd>
          </div>
          {quote.addressDetails ? (
            <div>
              <dt className="text-xs font-bold text-zinc-500">{ADDRESS_DETAILS_LABEL}</dt>
              <dd className="mt-0.5 font-semibold">{quote.addressDetails}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-bold text-zinc-500">Broj telefona</dt>
            <dd className="mt-0.5 font-semibold">{quote.phone}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-zinc-500" role="status">
          {expired
            ? "Ponovo pošalji listu pre potvrde."
            : "Ova ponuda važi 15 minuta."}
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-semibold text-brand-dark"
          >
            {error}{" "}
            <a href={TEL_URL} className="underline">
              {DISPLAY_PHONE}
            </a>
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={locked}
            className={primaryButtonClass}
            onClick={() => {
              if (expired || Date.now() >= quote.expiresAt) onReprice();
              else onConfirm();
            }}
          >
            {sending
              ? "Šaljem…"
              : calculating
                ? "Proveravam…"
                : expired
                  ? "Ponovo pošalji"
                  : "Potvrdi kupovinu"}
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={onClose}
            className={`${secondaryButtonClass} w-full`}
          >
            Izmeni podatke
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

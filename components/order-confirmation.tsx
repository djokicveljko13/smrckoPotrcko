"use client";

import { useEffect, useRef, useState } from "react";
import { DeliveryAnimation } from "@/components/delivery-animation";
import { ModalShell } from "@/components/modal-shell";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { deliveryPriceLabel } from "@/lib/pricing";
import type { OrderQuote } from "@/lib/order-types";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

type OrderConfirmationProps = {
  quote: OrderQuote;
  calculating: boolean;
  sending: boolean;
  error?: string;
  invalidQuote: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReprice: () => void;
};

export function OrderConfirmation({ quote, calculating, sending, error, invalidQuote, onClose, onConfirm, onReprice }: OrderConfirmationProps) {
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
    <ModalShell titleId="confirmation-title" descriptionId="confirmation-price" locked={locked} onClose={onClose}>
      {sending ? <DeliveryAnimation /> : null}
      <div inert={sending}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">Još jedan korak</p>
        <h2 ref={headingRef} tabIndex={-1} id="confirmation-title" className="mt-2 font-display text-2xl font-black italic uppercase outline-none sm:text-3xl">Potvrdi porudžbinu</h2>
        <div id="confirmation-price" className="mt-5 rounded-2xl bg-brand/5 p-4">
          <p className="text-sm font-bold text-zinc-700">Cena dostave</p>
          <p className="mt-1 font-display text-4xl font-black italic text-brand">{deliveryPriceLabel(quote.price)}</p>
        </div>
        <dl className="mt-5 space-y-3 text-sm [overflow-wrap:anywhere]">
          {[
            ["Šta donosimo", quote.order.title],
            ["Odakle preuzimamo", quote.order.shop],
            ["Gde donosimo", quote.order.address],
            ...(quote.order.addressDetails ? [["Sprat, stan, ulaz", quote.order.addressDetails]] : []),
            ["Broj telefona", quote.order.phone],
          ].map(([label, value]) => (
            <div key={label}><dt className="text-xs font-bold text-zinc-500">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap font-semibold">{value}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-zinc-500" role="status">{expired ? "Ponovo proveri cenu pre potvrde." : "Ova cena važi 15 minuta od obračuna."}</p>
        {error ? <p role="alert" className="mt-3 rounded-xl border-2 border-brand bg-brand/5 p-3 text-sm font-semibold text-brand-dark">{error} <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a></p> : null}
        <div className="mt-5 space-y-3">
          <button type="button" disabled={locked} className={primaryButtonClass}
            onClick={() => {
              if (expired || Date.now() >= quote.expiresAt) onReprice();
              else onConfirm();
            }}>
            {sending ? "Šaljem…" : calculating ? "Računam cenu…" : expired ? "Ponovo proveri cenu" : "Potvrdi porudžbinu"}
          </button>
          <button type="button" disabled={locked} onClick={onClose} className={`${secondaryButtonClass} w-full`}>Izmeni podatke</button>
        </div>
      </div>
    </ModalShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { DeliveryAnimation } from "@/components/delivery-animation";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const backdropPointer = useRef(false);
  const [now, setNow] = useState(Date.now);
  const expired = invalidQuote || now >= quote.expiresAt;
  const locked = calculating || sending;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    headingRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, quote.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [quote.expiresAt]);

  function outside(event: React.PointerEvent<HTMLDialogElement> | React.MouseEvent<HTMLDialogElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="confirmation-title" aria-describedby="confirmation-price" aria-busy={locked}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border-2 border-zinc-100 bg-white p-5 text-ink shadow-2xl backdrop:bg-ink/60 sm:p-7"
      onCancel={(event) => { event.preventDefault(); if (!locked) onClose(); }}
      onPointerDown={(event) => { backdropPointer.current = outside(event); }}
      onClick={(event) => { if (!locked && backdropPointer.current && outside(event)) onClose(); backdropPointer.current = false; }}>
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
    </dialog>
  );
}

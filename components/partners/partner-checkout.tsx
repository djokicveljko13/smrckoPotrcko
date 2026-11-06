"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPartnerOrder, estimatePartnerDelivery } from "@/app/actions/partner-order";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { PhoneIcon } from "@/components/icons";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { ADDRESS_DETAILS_LABEL } from "@/lib/labels";
import { readCart, saveCart, type Cart } from "@/lib/partners/cart";
import type { Partner } from "@/lib/partners/types";
import { fieldClass, fieldIconClass, fieldWithIconClass, labelClass, primaryButtonClass } from "@/lib/ui";

const NOT_CONFIRMED = "Slanje nije potvrđeno. Pozovi nas da proverimo porudžbinu pre ponovnog slanja.";

function dinars(amount: number) {
  return `${amount.toLocaleString("sr-RS")} din`;
}

export function PartnerCheckout({ partner }: { partner: Partner }) {
  const router = useRouter();
  // null znači da korpu još nismo pročitali, a {} da je stvarno prazna.
  const [cart, setCart] = useState<Cart | null>(null);
  const [addressChosen, setAddressChosen] = useState(false);
  const [addressDetails, setAddressDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<{ price: number; token: string } | null>(null);
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [orderError, setOrderError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prvi prikaz mora da se poklopi sa HTML-om sa servera
    setCart(readCart(partner.slug));
  }, [partner.slug]);

  // Čim kupac izabere adresu, server računa dostavu.
  useEffect(() => {
    if (!addressChosen || !formRef.current) return;

    // Ako kupac promeni adresu pre odgovora, stari odgovor se ne sme prikazati.
    let outdated = false;
    estimatePartnerDelivery(new FormData(formRef.current))
      .then((result) => {
        if (outdated) return;
        setDelivery(result);
        setDeliveryFailed(result === null);
      })
      .catch(() => {
        if (!outdated) setDeliveryFailed(true);
      });

    return () => {
      outdated = true;
    };
  }, [addressChosen, retryCount]);

  function handleAddressSelect(selected: boolean) {
    setAddressChosen(selected);
    setDelivery(null);
    setDeliveryFailed(false);
    setOrderError("");
  }

  function calculateDeliveryAgain() {
    setDelivery(null);
    setDeliveryFailed(false);
    setRetryCount(retryCount + 1);
  }

  async function sendOrder(currentCart: Cart, deliveryToken: string) {
    setSending(true);
    setOrderError("");
    try {
      const result = await createPartnerOrder({
        slug: partner.slug,
        cart: currentCart,
        deliveryToken,
        addressDetails,
        phone,
      });

      if (result.status === "ok") {
        saveCart(partner.slug, {});
        router.push(`/hvala?broj=${result.ticket}&cena=${result.deliveryPrice}&ukupno=${result.total}`);
        return; // dugme ostaje zaključano dok se ne otvori strana „Hvala”
      }

      if (result.status === "expired") {
        setOrderError("Cena dostave je istekla, pa je računamo ponovo. Proveri je i klikni „Poruči”.");
        calculateDeliveryAgain();
      } else {
        setOrderError(result.message);
      }
    } catch {
      setOrderError(NOT_CONFIRMED);
    }
    setSending(false);
  }

  if (!cart) return null;

  const menuLink = `/partneri/${partner.slug}#meni`;
  const orderedItems = partner.menu.filter((item) => (cart[item.id] ?? 0) > 0);

  if (orderedItems.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="font-bold text-ink">Korpa je prazna.</p>
        <Link href={menuLink} className="mt-3 inline-block font-bold text-brand-dark underline">
          Nazad na meni
        </Link>
      </div>
    );
  }

  let foodTotal = 0;
  for (const item of orderedItems) {
    foodTotal += cart[item.id] * item.price;
  }

  const canSend = delivery !== null && phone.trim() !== "" && !sending;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
        Porudžbina
      </h2>

      <ul className="mt-4 divide-y divide-zinc-200">
        {orderedItems.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-3 text-ink">
            <span>
              {cart[item.id]} × {item.name}
            </span>
            <span className="shrink-0 font-bold">{dinars(cart[item.id] * item.price)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => router.push(menuLink)}
        className="mt-2 inline-flex min-h-10 items-center rounded-xl bg-brand-dark px-4 font-display text-sm font-extrabold text-white shadow-[0_3px_0_rgba(112,14,10,0.55)] transition hover:bg-brand active:translate-y-0.5 active:shadow-none"
      >
        Izmeni
      </button>

      <div className="mt-5 flex items-center justify-between gap-4 border-t-2 border-ink pt-3 font-black text-ink">
        <p>Cena bez dostave</p>
        <p className="shrink-0">{dinars(foodTotal)}</p>
      </div>

      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) void sendOrder(cart, delivery.token);
        }}
        className="mt-8"
      >
        <fieldset disabled={sending} className="space-y-3">
          <AddressAutocomplete onSelect={handleAddressSelect} />
          <div>
            <label htmlFor="address_details" className={labelClass}>
              {ADDRESS_DETAILS_LABEL} <span className="font-medium text-zinc-500">(opciono)</span>
            </label>
            <input
              id="address_details"
              name="address_details"
              maxLength={150}
              className={fieldClass}
              placeholder="Npr. ulaz B, 2. sprat, stan 8"
              value={addressDetails}
              onChange={(event) => setAddressDetails(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Broj telefona</label>
            <div className="relative mt-1.5">
              <span className={fieldIconClass}><PhoneIcon /></span>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                maxLength={40}
                autoComplete="tel"
                className={fieldWithIconClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {addressChosen && delivery === null && !deliveryFailed ? (
          <p role="status" className="mt-6 font-bold text-zinc-600">
            Računam dostavu…
          </p>
        ) : null}

        {deliveryFailed ? (
          <p role="alert" className="mt-6 rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
            Cena dostave trenutno nije dostupna.{" "}
            <button type="button" className="font-bold underline" onClick={calculateDeliveryAgain}>
              Pokušaj ponovo
            </button>{" "}
            ili pozovi <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>.
          </p>
        ) : null}

        {delivery !== null ? (
          <div role="status" className="mt-6">
            <p className="flex justify-between gap-4 font-bold text-ink">
              <span>Cena dostave</span>
              <span>{dinars(delivery.price)}</span>
            </p>
            <p className="mt-2 flex justify-between gap-4 border-t-2 border-ink pt-3 text-xl font-black text-ink">
              <span>Ukupno</span>
              <span>{dinars(foodTotal + delivery.price)}</span>
            </p>
          </div>
        ) : null}

        {orderError ? (
          <p role="alert" className="mt-6 rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">
            {orderError} <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>
          </p>
        ) : null}

        <button type="submit" disabled={!canSend} className={`${primaryButtonClass} mt-6`}>
          {sending ? "Šaljem…" : "Poruči"}
        </button>
      </form>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_QUANTITY, readCart, saveCart, type Cart } from "@/lib/partners/cart";
import type { Partner } from "@/lib/partners/types";

function priceLabel(price: number, unit?: string) {
  const amount = `${price.toLocaleString("sr-RS")} din`;
  return unit ? `${amount}/${unit}` : amount;
}

export function PartnerMenu({ partner }: { partner: Partner }) {
  const [cart, setCart] = useState<Cart>({});

  // Sačuvana korpa se čita tek u browseru, jer je server ne vidi.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prvi prikaz mora da se poklopi sa HTML-om sa servera
    setCart(readCart(partner.slug));
  }, [partner.slug]);

  function changeQuantity(itemId: string, change: number) {
    const newCart = { ...cart, [itemId]: (cart[itemId] ?? 0) + change };
    setCart(newCart);
    saveCart(partner.slug, newCart);
  }

  // Svi nazivi odeljaka, svaki samo jednom, redom kojim se javljaju u meniju.
  const sectionNames = [...new Set(partner.menu.map((item) => item.section))];

  // Zbir se uvek računa iz menija, pa ne može da se razđe sa korpom.
  let total = 0;
  for (const item of partner.menu) {
    total += (cart[item.id] ?? 0) * item.price;
  }

  return (
    <>
      {/* Navigacija po odeljcima: drži se ispod glavne trake dok se skroluje. */}
      <nav
        id="meni"
        aria-label="Odeljci menija"
        className="sticky top-16 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {sectionNames.map((name, index) => (
            <a
              key={name}
              href={`#odeljak-${index}`}
              className="shrink-0 rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-bold text-ink hover:border-brand"
            >
              {name}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {sectionNames.map((name, index) => (
          <section key={name} id={`odeljak-${index}`} className="scroll-mt-32 pb-10">
            <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
              {name}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {partner.menu.filter((item) => item.section === name).map((item) => {
                const quantity = cart[item.id] ?? 0;

                return (
                  <li
                    key={item.id}
                    className="flex min-h-28 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    {/*
                      Isti okvir 4:3 za sve slike, da kartice budu iste visine.
                      `contain` ne seče: jela ga popune, a uspravna limenka i
                      flaša stoje u sredini na beloj pozadini.
                    */}
                    {item.image ? (
                      <div className="relative mb-3 aspect-[4/3]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                          className="object-contain"
                        />
                      </div>
                    ) : null}
                    <h3 className="font-bold text-ink">{item.name}</h3>
                    {item.description ? (
                      <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <p className="font-bold text-brand-dark">
                        {priceLabel(item.price, item.unit)}
                      </p>

                      <div className="flex items-center gap-2">
                        {quantity > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, -1)}
                              aria-label={`Smanji količinu: ${item.name}`}
                              className="h-10 w-10 rounded-full border-2 border-brand-dark font-bold text-brand-dark"
                            >
                              −
                            </button>
                            <span aria-live="polite" className="w-6 text-center font-bold text-ink">
                              {quantity}
                            </span>
                          </>
                        ) : null}
                        {/* Isto dugme je „Dodaj” pa „+”, da fokus tastature ostane na njemu. */}
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          disabled={quantity >= MAX_QUANTITY}
                          aria-label={`Dodaj: ${item.name}`}
                          className="h-10 min-w-10 rounded-full bg-brand-dark px-3 font-bold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {quantity > 0 ? "+" : "Dodaj"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* pl-20 na telefonu čuva sadržaj od okruglog dugmeta za poziv u levom uglu. */}
      {total > 0 ? (
        <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-brand-dark py-3 pl-20 pr-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] font-bold text-white shadow-[0_-6px_20px_rgba(60,4,0,0.25)] sm:px-4">
          <p>Trenutna cena: {priceLabel(total)}</p>
          <Link
            href={`/partneri/${partner.slug}/porudzbina`}
            className="rounded-xl bg-white px-4 py-2.5 font-display text-sm font-extrabold text-brand-dark transition hover:bg-red-50"
          >
            Završi porudžbinu
          </Link>
        </div>
      ) : null}
    </>
  );
}

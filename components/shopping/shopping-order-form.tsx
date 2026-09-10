"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createShoppingOrder } from "@/app/actions/create-shopping-order";
import { prepareShoppingOrder } from "@/app/actions/prepare-shopping-order";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { ORBIT_MS } from "@/components/delivery-animation";
import { PhoneIcon } from "@/components/icons";
import { ShoppingConfirmation } from "@/components/shopping/shopping-confirmation";
import {
  newPaperItem,
  ShoppingPaper,
  type PaperItem,
} from "@/components/shopping/shopping-paper";
import { StorePicker } from "@/components/shopping/store-picker";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { deliveryPriceLabel, findShoppingStore, type ShoppingStore } from "@/lib/pricing";
import type {
  CreateShoppingOrderState,
  PrepareShoppingResult,
} from "@/lib/shopping-quote";
import { MAX_SHOPPING_NOTE } from "@/lib/shopping";
import {
  fieldClass,
  fieldIconClass,
  fieldWithIconClass,
  labelClass,
  primaryButtonClass,
} from "@/lib/ui";

export function ShoppingOrderForm() {
  const router = useRouter();
  const [store, setStore] = useState<ShoppingStore | null>(null);
  const [items, setItems] = useState<PaperItem[]>(() => [newPaperItem()]);
  const [prepared, setPrepared] = useState<Extract<PrepareShoppingResult, { status: "ok" }> | null>(null);
  const [prepareError, setPrepareError] = useState<Extract<PrepareShoppingResult, { status: "error" }> | null>(null);
  const [state, setState] = useState<CreateShoppingOrderState>(null);
  const [phase, setPhase] = useState<"idle" | "quoting" | "confirming" | "success">("idle");
  const submitRef = useRef<HTMLButtonElement>(null);
  const lastInput = useRef<FormData | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const startedAt = useRef(0);
  const sending = phase === "confirming" || phase === "success";
  const selectedStore = findShoppingStore(store);

  useEffect(() => () => {
    revision.current += 1;
  }, []);

  useEffect(() => {
    if (state?.status !== "ok") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = Date.now() - startedAt.current;
    const wait = reducedMotion ? 0 : Math.max(0, ORBIT_MS - elapsed);
    const timer = setTimeout(
      () => router.push(`/hvala?broj=${encodeURIComponent(state.ticket)}&cena=${state.price}`),
      wait,
    );
    return () => clearTimeout(timer);
  }, [state, router]);

  async function prepare(input: FormData) {
    if (busy.current) return;
    busy.current = true;
    const currentRevision = ++revision.current;
    lastInput.current = input;
    setPhase("quoting");
    setPrepareError(null);
    setState(null);
    try {
      const result = await prepareShoppingOrder(input);
      if (currentRevision !== revision.current) return;
      if (result.status === "ok") setPrepared(result);
      else setPrepareError(result);
    } catch {
      if (currentRevision !== revision.current) return;
      setPrepareError({
        status: "error",
        message: "Porudžbina trenutno nije dostupna. Pokušaj ponovo ili nas pozovi.",
      });
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
      setState({
        status: "error",
        message: "Ponuda je istekla. Ponovo pošalji listu.",
        expired: true,
      });
      return;
    }
    busy.current = true;
    setPhase("confirming");
    setState(null);
    setPrepareError(null);
    startedAt.current = Date.now();
    try {
      const result = await createShoppingOrder(prepared.token);
      setState(result);
      if (result.status === "ok") {
        setPhase("success");
        return;
      }
    } catch {
      setState({
        status: "error",
        message: "Slanje nije potvrđeno. Pozovi nas da proverimo porudžbinu pre ponovnog slanja.",
      });
    }
    busy.current = false;
    setPhase("idle");
  }

  const fields = prepareError?.fields;

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy.current) void prepare(new FormData(event.currentTarget));
        }}
        className="space-y-6"
        aria-busy={phase !== "idle"}
      >
        <fieldset disabled={phase !== "idle"} className="space-y-6">
          <StorePicker
            value={store}
            onChange={setStore}
            error={fields?.store}
            disabled={phase !== "idle"}
          />

          <ShoppingPaper
            items={items}
            onChange={setItems}
            error={fields?.items}
            disabled={phase !== "idle"}
          />

          <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
            <details className="group">
              <summary className="cursor-pointer list-none font-display text-base font-extrabold uppercase tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <span className="text-zinc-400 transition group-open:rotate-90">▸</span>
                  Napomena za Potrčka
                  <span className="font-sans text-xs font-medium normal-case tracking-normal text-zinc-500">
                    (opciono)
                  </span>
                </span>
              </summary>
              <textarea
                name="note"
                maxLength={MAX_SHOPPING_NOTE}
                rows={3}
                className={`${fieldClass} mt-3 resize-y`}
                placeholder="Npr. bez laktoze, zamena ako nema…"
                aria-invalid={Boolean(fields?.note)}
              />
              {fields?.note ? (
                <p className="mt-1 text-xs text-brand-dark">{fields.note}</p>
              ) : null}
            </details>

            <div className="mt-5 space-y-3 sm:space-y-4">
              <AddressAutocomplete
                name="address"
                label="Gde donosimo?"
                placeholder="Ulica i broj"
                maxLength={400}
                error={fields?.address}
              />
              <div>
                <label htmlFor="shopping_address_details" className={labelClass}>
                  Sprat, stan, ulaz{" "}
                  <span className="font-medium text-zinc-500">(opciono)</span>
                </label>
                <input
                  id="shopping_address_details"
                  name="address_details"
                  maxLength={150}
                  className={fieldClass}
                  placeholder="Npr. ulaz B, 2. sprat, stan 8"
                  aria-invalid={Boolean(fields?.address_details)}
                />
                {fields?.address_details ? (
                  <p className="mt-1 text-xs text-brand-dark">{fields.address_details}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="shopping_phone" className={labelClass}>
                  Broj telefona
                </label>
                <div className="relative mt-1.5">
                  <span className={fieldIconClass}>
                    <PhoneIcon />
                  </span>
                  <input
                    id="shopping_phone"
                    name="phone"
                    type="tel"
                    required
                    maxLength={40}
                    autoComplete="tel"
                    className={fieldWithIconClass}
                    aria-invalid={Boolean(fields?.phone)}
                    placeholder="06x xxx xxxx"
                  />
                </div>
                {fields?.phone ? (
                  <p className="mt-1 text-xs text-brand-dark">{fields.phone}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-brand/5 p-4">
              <p className="text-sm font-bold text-zinc-700">Cena dostave</p>
              {selectedStore ? (
                <>
                  <p className="mt-1 font-display text-4xl font-black italic text-brand">
                    {deliveryPriceLabel(selectedStore.price)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-600">
                    {selectedStore.label} · plaćanje keš
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  Izaberi radnju da vidiš cenu
                </p>
              )}
            </div>

            {prepareError && !prepared ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark"
              >
                {prepareError.message}{" "}
                <a href={TEL_URL} className="underline">
                  {DISPLAY_PHONE}
                </a>
              </p>
            ) : null}

            <button
              ref={submitRef}
              type="submit"
              disabled={phase !== "idle"}
              className={`${primaryButtonClass} mt-5`}
            >
              {phase === "quoting"
                ? "Proveravam…"
                : sending
                  ? "Šaljem…"
                  : "Pošalji Potrčka u kupovinu"}
            </button>
            <p className="mt-3 text-center text-xs font-medium leading-snug text-zinc-500">
              Prvo pregledaj listu i cenu, pa potvrdi.
            </p>
          </div>
        </fieldset>
      </form>

      {prepared ? (
        <ShoppingConfirmation
          key={prepared.token}
          quote={prepared.quote}
          calculating={phase === "quoting"}
          sending={sending}
          invalidQuote={state?.status === "error" && Boolean(state.expired)}
          error={
            prepareError?.message ??
            (state?.status === "error" ? state.message : undefined)
          }
          onClose={closePreview}
          onConfirm={() => void confirm()}
          onReprice={() => {
            if (lastInput.current) void prepare(lastInput.current);
          }}
        />
      ) : null}
    </>
  );
}

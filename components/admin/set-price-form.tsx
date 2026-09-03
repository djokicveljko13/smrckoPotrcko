"use client";

import { useActionState } from "react";
import {
  setDeliveryPrice,
  type SetDeliveryPriceState,
} from "@/app/actions/set-delivery-price";

/** Prikazuje se na kartici samo kad porudžbina nema izračunatu cenu. */
export function SetPriceForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(
    setDeliveryPrice,
    null as SetDeliveryPriceState,
  );

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="order_id" value={orderId} />
      <input
        name="price"
        type="number"
        inputMode="numeric"
        min={1}
        required
        placeholder="din"
        className="w-24 rounded-lg border-2 border-brand/40 bg-white px-2 py-1 text-sm font-medium text-ink outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-3 py-1 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Upiši cenu"}
      </button>
      {state && "error" in state ? (
        <span className="w-full text-xs font-semibold text-brand-dark">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

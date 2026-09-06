"use client";

import { useActionState } from "react";
import { assignOrder, type AssignOrderState } from "@/app/actions/assign-order";
import type { AssignCourierOption } from "@/lib/types";

/*
 * Rucna dodela sa table. Vidi se samo za 'nova' i 'poslata_kuriru' —
 * porudzbinu koju je kurir prihvatio ('krenuo') ne preotimamo.
 *
 * Kurira van smene NAMERNO pustamo u listu: Telegram ga probudi i on odluci.
 * Kurir koji vec vozi je disabled — baza bi to svejedno odbila ('busy'),
 * ali bolje je da vlasnik odmah vidi zasto nego da klikne pa dobije gresku.
 */
export function AssignCourierForm({
  orderId,
  couriers,
  currentCourierId,
}: {
  orderId: string;
  couriers: AssignCourierOption[];
  currentCourierId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    assignOrder.bind(null, orderId),
    null as AssignOrderState,
  );

  // Kurir koji vozi drugu porudzbinu ne moze da primi ovu. Onaj koji vec drzi
  // BAS ovu nije zauzet iz njenog ugla — njemu se sme poslati ponovo.
  const options = couriers.map((courier) => ({
    ...courier,
    selectable: !courier.busy || courier.id === currentCourierId,
  }));

  const hasSelectable = options.some((option) => option.selectable);

  if (couriers.length === 0) {
    return (
      <p className="mt-3 text-sm text-zinc-500">
        Nema aktivnih kurira. Dodaj ih na strani Kuriri.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-3 border-t-2 border-zinc-100 pt-3">
      <label
        htmlFor={`courier-${orderId}`}
        className="text-xs font-bold text-zinc-500"
      >
        Pošalji kuriru ručno
      </label>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <select
          id={`courier-${orderId}`}
          name="courier_id"
          required
          defaultValue=""
          className="flex-1 rounded-lg border-2 border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand"
        >
          <option value="" disabled>
            Izaberi kurira…
          </option>
          {options.map((option) => (
            <option
              key={option.id}
              value={option.id}
              disabled={!option.selectable}
            >
              {option.name}
              {option.busy && option.id !== currentCourierId ? " — zauzet" : ""}
              {!option.on_shift ? " — van smene" : ""}
              {!option.telegram_linked ? " — nema Telegram" : ""}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending || !hasSelectable}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Šaljem…" : "Pošalji"}
        </button>
      </div>

      {hasSelectable ? null : (
        <p className="mt-1 text-xs font-semibold text-zinc-500">
          Svi kuriri su trenutno na vožnji.
        </p>
      )}

      {state && "error" in state ? (
        <p className="mt-1 text-xs font-semibold text-brand-dark" role="alert">
          {state.error}
        </p>
      ) : null}

      {state && "ok" in state ? (
        <p className="mt-1 text-xs font-semibold text-emerald-700">
          Poslato. Kuriru je stigao Telegram.
        </p>
      ) : null}
    </form>
  );
}

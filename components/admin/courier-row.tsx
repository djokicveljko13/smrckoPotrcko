"use client";

import { useActionState, useState } from "react";
import {
  deleteCourier,
  setCourierActive,
  setCourierPin,
  updateCourier,
  type CourierFormState,
} from "@/app/actions/couriers";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import type { AdminCourier } from "@/lib/types";

/*
 * Jedan kurir = jedna kartica sa tri male forme (ime/telefon, PIN, ugasi/upali).
 * Cela kartica je client komponenta jer je skoro sva interaktivna — cepanje na
 * tri fajla ne bi platilo trud na stranici koju vidi samo vlasnik.
 */

const fieldClass =
  "w-full rounded-lg border-2 border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-brand";

const smallButtonClass =
  "rounded-lg border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

function Badge({ children, tone }: { children: string; tone: "on" | "off" | "warn" }) {
  const tones = {
    on: "border-emerald-200 bg-emerald-50 text-emerald-700",
    off: "border-zinc-200 bg-zinc-50 text-zinc-500",
    warn: "border-brand/30 bg-brand/5 text-brand-dark",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Greška jedne forme; null kad greške nema ili je akcija prošla. */
function FormError({ state }: { state: CourierFormState }) {
  if (!state || !("error" in state)) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-brand-dark" role="alert">
      {state.error}
    </p>
  );
}

export function CourierRow({
  courier,
  siteUrl,
}: {
  courier: AdminCourier;
  siteUrl: string;
}) {
  // Tri forme = tri odvojena stanja. Greška u PIN-u ne sme da obriše poruku
  // koju je ostavila forma za ime, i obrnuto.
  const [editState, editAction, editPending] = useActionState(
    updateCourier.bind(null, courier.id),
    null as CourierFormState,
  );

  const [pinState, pinAction, pinPending] = useActionState(
    setCourierPin.bind(null, courier.id),
    null as CourierFormState,
  );

  const [activeState, activeAction, activePending] = useActionState(
    setCourierActive.bind(null, courier.id, !courier.is_active),
    null as CourierFormState,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCourier.bind(null, courier.id),
    null as CourierFormState,
  );

  // Brisanje je nepovratno, pa trazi dva klika. window.confirm je namerno
  // izbegnut: sistemski prozor je ruzan i neki browseri ga blokiraju.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const courierUrl = `${siteUrl}/k/${courier.access_token}`;

  return (
    <li
      className={`rounded-2xl border-2 p-4 ${
        courier.is_active ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-extrabold">{courier.name}</p>
          <a
            href={`tel:${courier.phone}`}
            className="text-sm font-medium text-zinc-500 underline underline-offset-2"
          >
            {courier.phone}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {courier.is_active ? null : <Badge tone="off">ugašen</Badge>}
          <Badge tone={courier.on_shift ? "on" : "off"}>
            {courier.on_shift ? "na smeni" : "van smene"}
          </Badge>
          <Badge tone={courier.telegram_linked ? "on" : "warn"}>
            {courier.telegram_linked ? "Telegram ✓" : "nema Telegram"}
          </Badge>
        </div>
      </div>

      {courier.telegram_linked ? null : (
        <p className="mt-2 text-xs font-semibold text-brand-dark">
          Dok ne poveže Telegram, ponuda mu ne stiže — mora da ga zovneš.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="max-w-full truncate rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
          {courierUrl}
        </code>
        <CopyLinkButton value={courierUrl} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <form action={editAction}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="text-xs font-bold text-zinc-500">Ime</span>
              <input
                name="name"
                defaultValue={courier.name}
                required
                className={fieldClass}
              />
            </label>
            <label className="flex-1">
              <span className="text-xs font-bold text-zinc-500">Telefon</span>
              <input
                name="phone"
                defaultValue={courier.phone}
                required
                className={fieldClass}
              />
            </label>
            <button type="submit" disabled={editPending} className={smallButtonClass}>
              {editPending ? "…" : "Sačuvaj"}
            </button>
          </div>
          <FormError state={editState} />
        </form>

        <form action={pinAction}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="text-xs font-bold text-zinc-500">Nov PIN</span>
              {/* type=text namerno: vlasnik mora da vidi PIN da bi ga izdiktirao. */}
              <input
                name="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                maxLength={8}
                required
                placeholder="4–8 cifara"
                className={fieldClass}
              />
            </label>
            <button type="submit" disabled={pinPending} className={smallButtonClass}>
              {pinPending ? "…" : "Promeni PIN"}
            </button>
          </div>
          <FormError state={pinState} />
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={activeAction}>
          <button
            type="submit"
            disabled={activePending}
            className={smallButtonClass}
          >
            {activePending
              ? "…"
              : courier.is_active
                ? "Ugasi kurira"
                : "Upali kurira"}
          </button>
        </form>

        {confirmingDelete ? (
          <form action={deleteAction} className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-dark">
              Briše se zauvek. 
            </span>
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-lg border-2 border-brand bg-brand px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {deletePending ? "Brišem…" : "Da, obriši"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className={smallButtonClass}
            >
              Odustani
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg border-2 border-brand/30 bg-white px-3 py-1.5 text-sm font-bold text-brand-dark transition-colors hover:border-brand"
          >
            Obriši
          </button>
        )}
      </div>

      <FormError state={activeState} />
      <FormError state={deleteState} />
    </li>
  );
}

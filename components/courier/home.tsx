"use client";

import { useActionState } from "react";
import {
  courierDashboardAction,
  type CourierActionState,
} from "@/app/actions/courier";
import { CourierJobDetails } from "@/components/courier/job-details";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { CourierDashboardData } from "@/lib/types";

export function CourierHome({
  token,
  dashboard,
  telegramConnectUrl,
}: {
  token: string;
  dashboard: CourierDashboardData;
  telegramConnectUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    courierDashboardAction.bind(null, token),
    null as CourierActionState,
  );

  return (
    <div className="mt-6 space-y-5">
      {state?.error ? (
        <p
          className="rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {!dashboard.telegramLinked ? (
        <section className="rounded-2xl border-2 border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-bold text-ink">Poveži Telegram</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Bez ovoga ponuda stigne u bazu, ali telefon ne zvoni. Otvori link
            na telefonu gde imaš Telegram, pa osveži ovu stranicu.
          </p>
          {telegramConnectUrl ? (
            <a
              href={telegramConnectUrl}
              target="_blank"
              rel="noreferrer"
              className={`${primaryButtonClass} mt-3`}
            >
              Otvori bota
            </a>
          ) : (
            <p className="mt-2 text-sm font-semibold text-brand-dark">
              Vlasnik još nije podesio ime bota.
            </p>
          )}
        </section>
      ) : null}

      <form action={formAction}>
        <p className="mb-2 text-sm font-semibold text-zinc-500">
          {dashboard.onShift ? "Na smeni" : "Nisi na smeni"}
        </p>
        <button
          type="submit"
          name="intent"
          value={dashboard.onShift ? "shift_off" : "shift_on"}
          disabled={pending}
          aria-pressed={dashboard.onShift}
          className={
            dashboard.onShift
              ? `${secondaryButtonClass} w-full`
              : primaryButtonClass
          }
        >
          {pending
            ? "Upisujem…"
            : dashboard.onShift
              ? "Ugasi smenu"
              : "Uključi smenu"}
        </button>
      </form>

      {dashboard.offer ? (
        <section className="rounded-2xl border-2 border-brand/40 border-l-[6px] border-l-brand bg-white p-4">
          <h2 className="text-sm font-bold text-brand-dark">Ponuđena vožnja</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Odgovori što pre. Ako ne stigneš, ide sledećem (to stiže u
            sledećoj fazi).
          </p>
          <CourierJobDetails job={dashboard.offer} />
          <form action={formAction} className="mt-4 flex gap-2">
            <input type="hidden" name="order_id" value={dashboard.offer.id} />
            <button
              type="submit"
              name="intent"
              value="accept"
              disabled={pending}
              className={`${primaryButtonClass} flex-1`}
            >
              {pending ? "…" : "Prihvatam"}
            </button>
            <button
              type="submit"
              name="intent"
              value="decline"
              disabled={pending}
              className={`${secondaryButtonClass} flex-1`}
            >
              {pending ? "…" : "Ne mogu"}
            </button>
          </form>
        </section>
      ) : null}

      {dashboard.active ? (
        <section className="rounded-2xl border-2 border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-bold text-ink">Voziš</h2>
          <CourierJobDetails job={dashboard.active} />
          <form action={formAction} className="mt-4">
            <input type="hidden" name="order_id" value={dashboard.active.id} />
            <button
              type="submit"
              name="intent"
              value="deliver"
              disabled={pending}
              className={primaryButtonClass}
            >
              {pending ? "Upisujem…" : "Isporučeno"}
            </button>
          </form>
        </section>
      ) : null}

      {!dashboard.offer && !dashboard.active ? (
        <p className="text-sm text-zinc-600">
          {dashboard.onShift
            ? "Nema ponude. Kad stigne Telegram, osveži."
            : "Uključi smenu da bi dobijao ponude."}
        </p>
      ) : null}

      {dashboard.today.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold text-zinc-500">Danas</h2>
          <ul className="mt-2 space-y-2">
            {dashboard.today.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border-2 border-zinc-100 px-4 py-3 text-sm"
              >
                <span className="font-bold">{job.public_number}</span>
                {" — "}
                {job.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

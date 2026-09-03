import { SetPriceForm } from "@/components/admin/set-price-form";
import { SOURCE_LABEL, STATUS_LABEL, formatBoardTime } from "@/lib/labels";
import { deliveryPriceLabel, distanceLabel } from "@/lib/pricing";
import type { BoardOrder } from "@/lib/types";

type Props = {
  order: BoardOrder;
  /** Delivered cards stay readable but quiet. */
  delivered?: boolean;
};

export function OrderCard({ order, delivered = false }: Props) {
  const unassigned = order.status === "nova";

  return (
    <article
      className={
        delivered
          ? "rounded-2xl border-2 border-zinc-200 bg-white p-4 text-zinc-600"
          : unassigned
            ? "rounded-2xl border-2 border-brand/40 border-l-[6px] border-l-brand bg-white p-4"
            : "rounded-2xl border-2 border-zinc-200 bg-white p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {unassigned ? (
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand animate-pulse motion-reduce:animate-none"
              aria-hidden
            />
          ) : null}
          <p className="font-display text-lg font-black italic uppercase tracking-tight text-ink">
            {order.public_number}
          </p>
        </div>
        <p
          className={
            delivered
              ? "rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600"
              : unassigned
                ? "rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand-dark"
                : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700"
          }
        >
          {STATUS_LABEL[order.status]}
        </p>
      </div>

      <p className="mt-2 font-semibold text-ink">{order.title}</p>
      <dl className="mt-2 space-y-1 text-sm">
        <div>
          <dt className="inline text-zinc-500">Odakle: </dt>
          <dd className="inline">{order.shop}</dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Adresa: </dt>
          <dd className="inline">{order.address}</dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Telefon: </dt>
          <dd className="inline">
            <a
              href={`tel:${order.phone}`}
              className="font-semibold text-ink underline underline-offset-2"
            >
              {order.phone}
            </a>
          </dd>
        </div>
        {order.distance_m !== null ? (
          <div>
            <dt className="inline text-zinc-500">Razdaljina: </dt>
            <dd className="inline">{distanceLabel(order.distance_m)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline text-zinc-500">Dostava: </dt>
          <dd className="inline font-semibold text-ink">
            {order.delivery_price !== null
              ? deliveryPriceLabel(order.delivery_price)
              : "nije izračunata"}
          </dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Izvor: </dt>
          <dd className="inline">{SOURCE_LABEL[order.source]}</dd>
        </div>
        {order.courier ? (
          <div>
            <dt className="inline text-zinc-500">Kurir: </dt>
            <dd className="inline">{order.courier.name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline text-zinc-500">Vreme: </dt>
          <dd className="inline">{formatBoardTime(order.created_at)}</dd>
        </div>
      </dl>

      {order.delivery_price === null ? (
        <div className="mt-3 rounded-xl border-2 border-brand/40 bg-brand/5 px-3 py-2">
          <p className="text-sm font-semibold text-brand-dark">
            Cena dostave nije izračunata — upiši je ručno.
          </p>
          <SetPriceForm orderId={order.id} />
        </div>
      ) : null}
    </article>
  );
}

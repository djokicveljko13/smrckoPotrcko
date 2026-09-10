import { deliveryPriceLabel, distanceLabel } from "@/lib/pricing";
import type { CourierJob } from "@/lib/types";

export function CourierJobDetails({ job }: { job: CourierJob }) {
  const isShopping = job.order_type === "kupovina";
  const items = job.items ?? [];

  return (
    <div className="mt-3 space-y-2">
      <p className="font-display text-xl font-black italic uppercase tracking-tight">
        {job.public_number}
      </p>
      {isShopping ? (
        <p className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand-dark">
          Kupovina
        </p>
      ) : null}
      <p className="font-semibold text-ink">{job.title}</p>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-zinc-500">{isShopping ? "Market: " : "Odakle: "}</dt>
          <dd className="inline">{job.shop}</dd>
        </div>
        {isShopping && items.length > 0 ? (
          <div>
            <dt className="text-zinc-500">Lista:</dt>
            <dd className="mt-1">
              <ol className="list-decimal space-y-0.5 pl-5 font-medium text-ink">
                {items.map((item, index) => (
                  <li key={item.id ?? `${index}-${item.text}`}>{item.text}</li>
                ))}
              </ol>
            </dd>
          </div>
        ) : null}
        {isShopping && job.shopping_note ? (
          <div>
            <dt className="inline text-zinc-500">Napomena: </dt>
            <dd className="inline whitespace-pre-wrap">{job.shopping_note}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline text-zinc-500">Adresa: </dt>
          <dd className="inline">{job.address}</dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Telefon: </dt>
          <dd className="inline">
            <a
              href={`tel:${job.phone}`}
              className="font-semibold text-ink underline underline-offset-2"
            >
              {job.phone}
            </a>
          </dd>
        </div>
        {!isShopping && job.distance_m !== null ? (
          <div>
            <dt className="inline text-zinc-500">Razdaljina: </dt>
            <dd className="inline">{distanceLabel(job.distance_m)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline text-zinc-500">Naplati dostavu: </dt>
          <dd className="inline font-semibold text-ink">
            {job.delivery_price !== null
              ? deliveryPriceLabel(job.delivery_price)
              : "dogovor telefonom"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

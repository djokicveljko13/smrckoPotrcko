import { deliveryPriceLabel, distanceLabel } from "@/lib/pricing";
import type { CourierJob } from "@/lib/types";

export function CourierJobDetails({ job }: { job: CourierJob }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="font-display text-xl font-black italic uppercase tracking-tight">
        {job.public_number}
      </p>
      <p className="font-semibold text-ink">{job.title}</p>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-zinc-500">Odakle: </dt>
          <dd className="inline">{job.shop}</dd>
        </div>
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
        {job.distance_m !== null ? (
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

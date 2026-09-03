import { OrderCard } from "@/components/admin/order-card";
import type { BoardOrder } from "@/lib/types";

type Props = {
  title: string;
  hint: string;
  count: number;
  empty: string;
  orders: BoardOrder[];
  delivered?: boolean;
};

export function OrderColumn({
  title,
  hint,
  count,
  empty,
  orders,
  delivered = false,
}: Props) {
  return (
    <section
      className={
        delivered
          ? "rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-4 sm:p-5"
          : "rounded-3xl border-2 border-brand/25 bg-white p-4 sm:p-5"
      }
    >
      <header className="lg:sticky lg:top-3 lg:z-10 lg:bg-inherit lg:pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-black italic uppercase tracking-tight text-ink">
            {title}
          </h2>
          <p
            className={
              delivered
                ? "rounded-full bg-zinc-200 px-2.5 py-0.5 text-sm font-bold text-zinc-700"
                : "rounded-full bg-brand px-2.5 py-0.5 text-sm font-bold text-white"
            }
          >
            {count}
          </p>
        </div>
        <p className="mt-1 text-sm text-zinc-500">{hint}</p>
      </header>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} delivered={delivered} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

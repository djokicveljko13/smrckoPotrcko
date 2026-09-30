import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { OrderColumn } from "@/components/admin/order-column";
import { RefreshButton } from "@/components/admin/refresh-button";
import { requireOwner } from "@/lib/auth";
import { secondaryButtonClass } from "@/lib/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssignCourierOption, BoardOrder } from "@/lib/types";
const DELIVERED_DAYS = 7;
function deliveredSince(): string {
  return new Date(
    Date.now() - DELIVERED_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}
const ORDER_COLUMNS =
  "id, public_number, title, shop, address, phone, delivery_price, distance_m, source, status, courier_id, assigned_at, created_at, order_type, shopping_note, shopping_items(text, sort_order), courier:couriers(name, phone)";

function asCourierEmbed(value: unknown): BoardOrder["courier"] {
  if (!value || typeof value !== "object") return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const { name, phone } = row as { name?: unknown; phone?: unknown };
  if (typeof name !== "string" || typeof phone !== "string") return null;
  return { name, phone };
}

function asShoppingItems(value: unknown): BoardOrder["shopping_items"] {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const { text, sort_order } = row as { text?: unknown; sort_order?: unknown };
      if (typeof text !== "string") return null;
      return {
        text,
        sort_order: typeof sort_order === "number" ? sort_order : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return items.length > 0 ? items : [];
}

export default async function AdminPage() {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  // Dva upita paralelno: cekati ih jedan za drugim bi bez razloga usporilo
  // tablu, jer ne zavise jedan od drugog.
const since = deliveredSince();
  const [ordersResult, couriersResult] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .or(`status.neq.isporuceno,created_at.gte.${since}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("couriers")
      .select("id, name, on_shift, telegram_chat_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const orders: BoardOrder[] = (ordersResult.data ?? []).map((row) => {
    const raw = row as Omit<BoardOrder, "courier" | "shopping_items"> & {
      courier?: unknown;
      shopping_items?: unknown;
    };
    return {
      ...raw,
      courier: asCourierEmbed(raw.courier),
      shopping_items: asShoppingItems(raw.shopping_items),
    };
  });

  const open = orders
    .filter((order) => order.status !== "isporuceno")
    .slice()
    .sort((a, b) => Number(b.status === "nova") - Number(a.status === "nova"));
  const delivered = orders.filter((order) => order.status === "isporuceno");

  // Ko je zauzet vec znamo iz porudzbina koje smo dohvatili — nema potrebe
  // za trecim upitom bazi. Zauzet = ima zivu ponudu ili vozi.
  const busyCourierIds = new Set(
    orders
      .filter(
        (order) =>
          order.status === "poslata_kuriru" || order.status === "krenuo",
      )
      .map((order) => order.courier_id)
      .filter((id): id is string => id !== null),
  );

  const couriers: AssignCourierOption[] = (couriersResult.data ?? []).map(
    (row) => ({
      id: row.id as string,
      name: row.name as string,
      on_shift: Boolean(row.on_shift),
      telegram_linked: row.telegram_chat_id !== null,
      busy: busyCourierIds.has(row.id as string),
    }),
  );

  const loadError = ordersResult.error;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-500">Samo vlasnik</p>
          <h1 className="mt-1 font-display text-3xl font-black italic uppercase tracking-tight">
            Dispečer tabla
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Levo / gore je posao. Desno / dole je gotovo. Osveži ručno (F5).
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <AdminNav current="/admin" />
          <div className="flex items-center gap-2">
            <RefreshButton />
            <form action={signOut}>
              <button type="submit" className={secondaryButtonClass}>
                Odjavi se
              </button>
            </form>
          </div>
        </div>
      </div>

      {loadError ? (
        <p className="mt-6 text-sm font-semibold text-brand-dark" role="alert">
          Tabla se nije učitala. Osveži stranicu.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <OrderColumn
            title="Treba isporučiti"
            hint="Nove imaju crvenu tačku. Prvo njih."
            count={open.length}
            empty="Nema otvorenih porudžbina."
            orders={open}
            couriers={couriers}
          />
          <OrderColumn
            title="Isporučeno"
            hint="Završene vožnje. Kurir se ovde ne bira."
            count={delivered.length}
            empty="Još nijedna nije označena kao isporučena."
            orders={delivered}
            delivered
          />
        </div>
      )}

      <p className="mt-8 text-sm">
        <Link
          href="/"
          className="font-bold text-zinc-400 underline underline-offset-4 hover:text-brand"
        >
          Javna forma
        </Link>
      </p>
    </div>
  );
}

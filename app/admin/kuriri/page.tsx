import Link from "next/link";
import { CourierCreateForm } from "@/components/admin/courier-create-form";
import { CourierRow } from "@/components/admin/courier-row";
import { requireOwner } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminCourier } from "@/lib/types";

/*
 * Zasebna stranica, ne tabla: tabla je operativni ekran (porudzbine), ovde se
 * kuriri vode. Zastita je requireOwner() — proxy.ts samo osvezava kolacic.
 */

const COURIER_COLUMNS =
  "id, name, phone, on_shift, is_active, access_token, telegram_chat_id";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
}

export default async function CouriersPage() {
  await requireOwner();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("couriers")
    .select(COURIER_COLUMNS)
    // Ugaseni na dno, pa aktivni po imenu — vlasnik prvo vidi one koji rade.
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  // Komponenti ne dajemo sirov red iz baze nego tacno ono sto joj treba:
  // telegram_chat_id je broj koji joj ne znaci nista, pitanje je samo "ima li ga".
  const couriers: AdminCourier[] = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    on_shift: Boolean(row.on_shift),
    is_active: Boolean(row.is_active),
    access_token: row.access_token as string,
    telegram_linked: row.telegram_chat_id !== null,
  }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-500">Samo vlasnik</p>
          <h1 className="mt-1 font-display text-3xl font-black italic uppercase tracking-tight">
            Kuriri
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Dodaj kurira, daj mu PIN i link. Smenu kurir pali sam.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink"
        >
          Nazad na tablu
        </Link>
      </div>

      <div className="mt-6">
        <CourierCreateForm />
      </div>

      {error ? (
        <p className="mt-6 text-sm font-semibold text-brand-dark" role="alert">
          Lista kurira se nije učitala. Osveži stranicu.
        </p>
      ) : couriers.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Još nema nijednog kurira. Dodaj prvog gore.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {couriers.map((courier) => (
            <CourierRow
              key={courier.id}
              courier={courier}
              siteUrl={siteUrl()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

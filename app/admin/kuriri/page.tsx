import Link from "next/link";
import { CourierCreateForm } from "@/components/admin/courier-create-form";
import { CourierRow } from "@/components/admin/courier-row";
import { AdminNav } from "@/components/admin/admin-nav";
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

type Period = "danas" | "ukupno";

// URL je unos korisnika: sve osim tacno "ukupno" (i ?period=bla) znaci danas.
function parsePeriod(value: string | string[] | undefined): Period {
  return value === "ukupno" ? "ukupno" : "danas";
}

const PERIOD_LINKS = [
  { period: "danas", href: "/admin/kuriri", label: "Danas" },
  { period: "ukupno", href: "/admin/kuriri?period=ukupno", label: "Ukupno" },
] as const;

export default async function CouriersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireOwner();
  const period = parsePeriod((await searchParams).period);
  const supabase = await createSupabaseServerClient();

  const [couriersResult, countsResult] = await Promise.all([
    supabase
      .from("couriers")
      .select(COURIER_COLUMNS)
      // Ugaseni na dno, pa aktivni po imenu — vlasnik prvo vidi one koji rade.
      .order("is_active", { ascending: false })
      .order("name", { ascending: true }),
    // View iz 20261014120000_courier_delivery_counts.sql: baza broji, ovde
    // stize po jedan red po kuriru umesto svih isporucenih porudzbina.
    supabase.from("courier_delivery_counts").select("courier_id, today, total"),
  ]);

  // id kurira -> broj za izabrani period. Kurir bez isporuka nema red u view-u.
  const counts = new Map(
    (countsResult.data ?? []).map((row) => [
      row.courier_id as string,
      Number(period === "danas" ? row.today : row.total),
    ]),
  );

  // Komponenti ne dajemo sirov red iz baze nego tacno ono sto joj treba:
  // telegram_chat_id je broj koji joj ne znaci nista, pitanje je samo "ima li ga".
  const couriers: AdminCourier[] = (couriersResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    on_shift: Boolean(row.on_shift),
    is_active: Boolean(row.is_active),
    access_token: row.access_token as string,
    telegram_linked: row.telegram_chat_id !== null,
    // Greska upita nije isto sto i nula isporuka, pa tada prikazujemo crticu.
    delivered: countsResult.error ? null : (counts.get(row.id as string) ?? 0),
  }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <AdminNav current="/admin/kuriri" />

      <div className="mt-6">
        <p className="text-sm font-bold text-zinc-500">Samo vlasnik</p>
        <h1 className="mt-1 font-display text-3xl font-black italic uppercase tracking-tight">
          Kuriri
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Dodaj kurira, daj mu PIN i link. Smenu kurir pali sam.
        </p>
      </div>

      <div className="mt-6">
        <CourierCreateForm />
      </div>

      {/* Obicni linkovi, ne useState: izbor ostaje u adresi, pa ga F5 cuva. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-zinc-500">Isporuke:</p>
        <nav
          aria-label="Period isporuka"
          className="inline-flex rounded-xl border-2 border-zinc-200 bg-white p-1"
        >
          {PERIOD_LINKS.map((link) => (
            <Link
              key={link.period}
              href={link.href}
              aria-current={link.period === period ? "page" : undefined}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                link.period === period
                  ? "bg-ink text-white"
                  : "text-zinc-500 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {countsResult.error ? (
        <p className="mt-2 text-sm font-semibold text-brand-dark" role="alert">
          Broj isporuka se nije učitao. Osveži stranicu.
        </p>
      ) : null}

      {couriersResult.error ? (
        <p className="mt-6 text-sm font-semibold text-brand-dark" role="alert">
          Lista kurira se nije učitala. Osveži stranicu.
        </p>
      ) : couriers.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Još nema nijednog kurira. Dodaj prvog gore.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {couriers.map((courier) => (
            <CourierRow
              key={courier.id}
              courier={courier}
              siteUrl={siteUrl()}
              periodLabel={period}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

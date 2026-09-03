import Link from "next/link";
import { deliveryPriceLabel } from "@/lib/pricing";

function ticketFromSearch(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  if (!/^P-\d+$/.test(raw)) return null;
  return raw;
}

function priceFromSearch(
  value: string | string[] | undefined,
): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,5}$/.test(raw)) return null;
  return Number(raw);
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const ticket = ticketFromSearch(params.broj);
  const price = priceFromSearch(params.cena);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-1 flex-col px-4 py-10">
      <p className="text-sm font-bold text-zinc-500">Šmrčko Potrčko</p>
      <h1 className="mt-2 font-display text-3xl font-black italic uppercase tracking-tight">
        Hvala, porudžbina je stigla
      </h1>

      {ticket ? (
        <div className="mt-6 space-y-4 text-zinc-800">
          {price !== null ? (
            <p className="font-display text-2xl font-black italic uppercase text-brand">
              Cena dostave je {deliveryPriceLabel(price)}.
            </p>
          ) : (
            <p className="text-zinc-700">Cenu dostave ti javljamo pozivom.</p>
          )}
          <p>
            Tvoj broj je{" "}
            <span className="font-bold tracking-wide">{ticket}</span>. Sačuvaj
            ga ako zoveš.
          </p>
          <p className="text-sm text-zinc-600">
            Plaćanje je keš kuriru. Nema praćenja na sajtu — javićemo se.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-zinc-700">
          Ako si upravo poslao formu, vidi broj na prethodnom koraku ili naruči
          ponovo.
        </p>
      )}

      <p className="mt-8 text-sm">
        <Link
          href="/"
          className="font-bold text-zinc-400 underline underline-offset-4 hover:text-brand"
        >
          Nova porudžbina
        </Link>
      </p>
    </div>
  );
}

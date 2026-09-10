import Link from "next/link";
import { CartIcon, PackageIcon } from "@/components/icons";

/**
 * Izbor usluge iznad forme na početnoj.
 * Prva kartica je statična (već si tu); druga vodi na /kupovina — bez tab-state-a.
 */
export function ServiceCards() {
  return (
    <div className="mb-6">
      <h2 className="text-center font-display text-xl font-black italic uppercase tracking-tight sm:text-2xl">
        Kako da ti pomognemo?
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article
          aria-current="page"
          className="rounded-3xl border-2 border-brand bg-brand/5 p-4 sm:p-5"
        >
          <PackageIcon className="h-7 w-7 text-brand" />
          <h3 className="mt-3 font-display text-base font-black italic uppercase tracking-tight sm:text-lg">
            Donesi mi nešto
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            Preuzmemo iz radnje i donesemo na tvoju adresu.
          </p>
        </article>

        <Link
          href="/kupovina"
          className="rounded-3xl border-2 border-zinc-200 bg-white p-4 transition hover:border-brand/50 sm:p-5"
        >
          <CartIcon className="h-7 w-7 text-brand" />
          <h3 className="mt-3 font-display text-base font-black italic uppercase tracking-tight sm:text-lg">
            Potrčko ide u kupovinu
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            Napiši listu, mi kupimo u marketu i donesemo.
          </p>
        </Link>
      </div>
    </div>
  );
}

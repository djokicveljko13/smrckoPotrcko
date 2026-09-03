import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { GuestOrderForm } from "@/components/guest-order-form";

/*
 * min-h-dvh = visina vidljivog ekrana (dinamicki vh).
 * Stari 100vh na telefonu broji i traku browsera, pa stranica "curi" ispod.
 * dvh se skupa kad se ta traka pokaze — zato prvi ekran drzi logo + tekst +
 * celu formu. Na uskom ekranu i dalje sme da skroluje ako ne stane.
 *
 * lg: dve kolone — levo prica, desno forma — da na racunaru sve stane
 * u jedan pogled, bez skrola.
 */
export default function HomePage() {
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 content-start gap-5 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:content-center lg:items-center lg:gap-12 lg:py-8">
      <header className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <BrandLogo className="w-40 sm:w-52 lg:w-72" priority />

        <h1 className="mt-4 font-display text-2xl font-black italic uppercase leading-[1.08] tracking-tight sm:mt-6 sm:text-3xl lg:text-4xl">
          Naruči bilo šta.
          <br />
          <span className="text-brand">Mi trčimo umesto Vas.</span>
        </h1>

       

        <p className="mt-4 hidden text-sm font-semibold text-zinc-500 lg:block">
          Plaćanje isključivo kešom kuriru.
        </p>
        <Link
          href="/admin"
          className="mt-2 hidden text-sm font-bold text-zinc-400 underline underline-offset-4 hover:text-brand lg:inline"
        >
          Tabla vlasnika
        </Link>
      </header>

      <section className="rounded-3xl border-2 border-zinc-100 bg-white p-4 shadow-[0_10px_40px_-16px_rgba(16,16,16,0.25)] sm:p-6">
        <h2 className="font-display text-xl font-black italic uppercase tracking-tight sm:text-2xl">
          Pošalji porudžbinu
        </h2>
      
        <GuestOrderForm />
      </section>

      <footer className="flex items-center justify-between gap-4 border-t-2 border-zinc-100 pt-3 text-sm lg:hidden">
        <p className="font-semibold text-zinc-500">
          Plaćanje isključivo kešom kuriru.
        </p>
        <Link
          href="/admin"
          className="shrink-0 font-bold text-zinc-400 underline underline-offset-4 hover:text-brand"
        >
          Tabla vlasnika
        </Link>
      </footer>
    </div>
  );
}

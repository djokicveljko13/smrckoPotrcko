import Link from "next/link";
import { HeroWave } from "@/components/hero-wave";
import { AnnouncementBar } from "@/components/announcement-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ContactStrip } from "@/components/contact-strip";
import { GuestOrderForm } from "@/components/guest-order-form";
import {
  ArrowDownIcon,
  BoltIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@/components/icons";
import { heroButtonClass } from "@/lib/ui";
import { SiteNav } from "@/components/site-nav";
/*
 * Tri obećanja koja kupac traži pre nego što ostavi telefon: koliko čeka,
 * dolazi li do njega i mora li da pravi nalog. Lista je podatak, ne tri
 * prekucana <li> — dodaje se stavka, ne kopira blok koda.
 *
 * Sada svaka ima i rečenicu objašnjenja: naslov je obećanje, rečenica ispod
 * je dokaz. "Brza dostava" bez dokaza je marketing, sa dokazom je informacija.
 */
const BADGES = [
  {
    Icon: BoltIcon,
    title: "Brza dostava",
    text: "Kurir kreće čim primimo porudžbinu, bez čekanja na potvrdu.",
  },
  {
    Icon: MapPinIcon,
    title: "Jagodina + 30 km",
    text: "Ceo grad i okolna mesta u krugu od 30 kilometara.",
  },
  {
    Icon: CheckCircleIcon,
    title: "Bez registracije",
    text: "Nema naloga ni lozinke. Plaćaš kuriru u kešu, na vratima.",
  },
];

/*
 * Ritam uvoda: naslov padne, pa se opis pojavi, pa dugme. Jedan pokret koji
 * nosi ekran (pad naslova) i dva tiha ulaska za njim — ne tri trika.
 *
 * Naslov pada 760ms (--animate-slam-in), pa opis kreće malo pre kraja pada:
 * blago preklapanje drži tempo, a puna tišina bi uvod pocepala na delove.
 */
const TITLE_DELAY_MS = 150;
const DESCRIPTION_DELAY_MS = 700;
const CTA_DELAY_MS = 1000;

/*
 * Stranica su sada ČETIRI trake jedna ispod druge, ne jedan grid:
 *
 *   1. hero  — pun ekran (min-h-dvh), crvena šara, logo + poruka + dugme
 *   2. #poruci — pun ekran, forma na sredini, obećanja ispod nje
 *   3. kontakt — za one koji radije zovu
 *   4. footer — pokretna traka sa porukom (ranije je stajala na vrhu)
 *
 * Zašto dva puna ekrana umesto svega odjednom: prvi ekran ima jedan posao —
 * da za dve sekunde objasni šta radimo. Forma sa četiri polja pored toga
 * cepa pažnju. Dugme "Poruči šta ti treba" je most: kupac sam odluči kada
 * prelazi sa čitanja na kucanje.
 */
export default function HomePage() {
  return (
  
    <div className="flex min-h-dvh flex-col">
       <SiteNav />
      <section className="hero-surface relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-24 text-center sm:pb-36 sm:pt-28">
        <BrandLogo className="w-60 sm:w-80 lg:w-[26rem]" priority onColor />

        {/* Ceo naslov pada kao jedan komad — vidi potrcko-slam-in u globals.css. */}
        <h1
          className="hero-title animate-slam-in mt-6 max-w-4xl origin-bottom font-display text-3xl font-black italic uppercase leading-[1.05] tracking-tight motion-reduce:animate-none sm:mt-8 sm:text-5xl lg:text-6xl"
          style={{ animationDelay: `${TITLE_DELAY_MS}ms` }}
        >
          Treba ti nešto?
          <br />
          <span className="hero-title-accent">Mi trčimo umesto tebe.</span>
        </h1>

        {/*
          Opis se samo tiho podigne (animate-rise-in), ne pada. Dva pada
          zaredom se takmiče; ovako pad naslova ostaje jedini pokret koji se
          pamti, a opis mu se pridruži bez galame.
        */}
        <p
          className="hero-description animate-rise-in mt-5 max-w-2xl motion-reduce:animate-none"
          style={{ animationDelay: `${DESCRIPTION_DELAY_MS}ms` }}
        >
          Hrana, namirnice, apoteka ili bilo šta drugo. Reci nam šta ti treba i
          donosimo na tvoju adresu.
        </p>

        {/*
          Običan <a href="#poruci">, ne next/link i ne dugme sa JavaScriptom:
          skok na deo iste stranice browser radi sam. next/link služi za
          prelazak na DRUGU rutu (i unapred je skida), a ovde nema šta da se
          skida — sekcija je već u HTML-u. Klizanje umesto skoka pali
          `scroll-behavior: smooth` iz globals.css.

          Dugme ulazi poslednje, tek kad je poruka sletela — ne pozivamo na
          klik pre nego što je pročitano zašto bi se kliknulo.
        */}
        <a
          href="#poruci"
          className={`${heroButtonClass} animate-rise-in mt-8 motion-reduce:animate-none sm:mt-10`}
          style={{ animationDelay: `${CTA_DELAY_MS}ms` }}
        >
          Poruči šta ti treba
          <ArrowDownIcon className="h-5 w-5" />
        </a>

        <HeroWave />
      </section>

      <section
        id="poruci"
        className="flex min-h-dvh flex-col justify-center bg-white px-4 py-14 sm:px-6 sm:py-16"
      >
        <div className="mx-auto w-full max-w-xl">
          {/* relative + z-10: bela kartica mora da stoji IZNAD crne trake. */}
          <div className="relative z-10 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
            <h2 className="font-display text-xl font-black italic uppercase tracking-tight sm:text-2xl">
              Šta da ti donesemo?
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Popuni podatke i mi preuzimamo dalje.
            </p>

            <GuestOrderForm />
          </div>

          {/*
            Crna traka koja viri ISPOD kartice, kao račun koji je izašao iz nje.

            Kako: negativna gornja margina (-mt-6) uvuče traku pod karticu, a
            veći gornji padding (pt-10) vrati sadržaj ispod njene ivice. Oko to
            čita kao jedan predmet u dva sloja, a ne kao tri odvojene kartice.

            Zašto crna a ne još jedna bela kartica: crni kosi natpis je već u
            logotipu. Treća boja brenda ovde zatvara sekciju i pravi razliku
            između "popuni" (belo) i "šta dobijaš" (crno).

            divide-dashed: isprekidana linija između stavki, kao perforacija na
            računu. Na telefonu deli po redovima (divide-y), od sm naviše po
            kolonama (sm:divide-x).
          */}
          <ul className="relative -mt-6 grid divide-y divide-dashed divide-white/20 rounded-3xl bg-ink px-2 pb-5 pt-10 text-white sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pb-6 sm:pt-11">
            {BADGES.map(({ Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-3 px-4 py-3.5 sm:flex-col sm:gap-2 sm:py-3"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand sm:mt-0 sm:h-6 sm:w-6" />
                <div>
                  <p className="font-display text-base font-black italic uppercase leading-none tracking-tight">
                    {title}
                  </p>
                  {/*
                    zinc-300, ne zinc-400: na crnoj podlozi tamnosiva slova su
                    "tu negde" ali se ne čitaju. Ovo je i dalje tiše od belog
                    naslova, a čita se bez naprezanja.
                  */}
                  <p className="mt-1.5 text-sm font-medium leading-snug text-zinc-300">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactStrip />

      {/* Ulaz za vlasnika: namerno sitno i na dnu — kupcu ne treba. */}
      <div className="bg-white pb-5 text-center">
        <Link
          href="/admin"
          className="text-xs font-bold text-zinc-400 underline underline-offset-4 hover:text-brand"
        >
          Tabla vlasnika
        </Link>
      </div>

      <AnnouncementBar />
    </div>
  );
}

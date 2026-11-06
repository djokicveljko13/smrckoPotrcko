import Image from "next/image";
import Link from "next/link";
import { HeroDivider } from "@/components/hero-divider";
import { AnnouncementBar } from "@/components/announcement-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ContactStrip } from "@/components/contact-strip";
import { GuestOrderForm } from "@/components/guest-order-form";
import { ServiceCards } from "@/components/service-cards";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@/components/icons";
import { PARTNERS } from "@/lib/partners";
import { heroButtonClass } from "@/lib/ui";
import { SiteNav } from "@/components/site-nav";
import { publicMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";

export const metadata = publicMetadata("/");
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
const PARTNER_DELAY_MS = 1300;

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
  
    <>
    <main className="flex min-h-dvh flex-col">
      <StructuredData path="/" />
       <SiteNav />
      <section className="hero-surface relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-20 text-center sm:pb-28 sm:pt-24">
        <BrandLogo className="w-44 sm:w-60 lg:w-72" priority onColor />

        {/* Ceo naslov pada kao jedan komad — vidi potrcko-slam-in u globals.css. */}
        <h1
          className="hero-title animate-slam-in mt-4 max-w-4xl origin-bottom font-display text-3xl font-black italic uppercase leading-[1.05] tracking-tight motion-reduce:animate-none sm:mt-6 sm:text-5xl lg:text-6xl"
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
          className="hero-description animate-rise-in mt-3 max-w-2xl motion-reduce:animate-none sm:mt-4"
          style={{ animationDelay: `${DESCRIPTION_DELAY_MS}ms` }}
        >
          Hrana, namirnice, apoteka ili bilo šta drugo. Reci nam šta ti treba i
          donosimo na tvoju adresu u Jagodini i do 30 km oko grada.
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
          className={`${heroButtonClass} animate-rise-in mt-5 motion-reduce:animate-none sm:mt-6`}
          style={{ animationDelay: `${CTA_DELAY_MS}ms` }}
        >
          Poruči šta ti treba
          <ArrowDownIcon className="h-5 w-5" />
        </a>

        {/*
          Kartica ulazi poslednja: prvo poruka i glavno dugme, pa restoran.
          Senka je na spoljnom linku jer maska na porudžbenici inače odseče
          sve što je izvan nje, pa i senku.
        */}
        {PARTNERS.map((partner) => (
          <Link
            key={partner.slug}
            href={`/partneri/${partner.slug}`}
            className="group animate-rise-in mt-5 block w-full max-w-md rounded-2xl text-left drop-shadow-[0_5px_0_rgba(112,14,10,0.55)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:animate-none motion-reduce:transition-none sm:mt-6"
            style={{ animationDelay: `${PARTNER_DELAY_MS}ms` }}
          >
            <span className="partner-ticket flex items-stretch rounded-2xl">
              {partner.logo ? (
                <span className="flex w-25 shrink-0 items-center justify-center py-2.5">
                  <span className="relative block h-20 w-20 -rotate-3 overflow-hidden rounded-xl transition-transform duration-200 group-hover:rotate-0 group-hover:scale-105 motion-reduce:transition-none">
                    {/* Naziv je odmah pored kao tekst, pa slika nema svoj opis. */}
                    <Image src={partner.logo} alt="" fill sizes="80px" className="scale-110 object-cover" />
                  </span>
                </span>
              ) : null}

              <span className="flex min-w-0 flex-1 items-center gap-2 border-l-2 border-dashed border-zinc-300 py-2.5 pl-3.5 pr-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.7rem] font-extrabold uppercase leading-tight tracking-wide text-brand-dark">
                    Gladan? Poruči iz restorana
                  </span>
                  <span className="mt-1 block font-display text-lg font-black italic uppercase leading-[1.05] tracking-tight text-ink">
                    {partner.name}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-zinc-600">
                    {partner.tagline}
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">
                  <ArrowRightIcon className="h-5 w-5" />
                </span>
              </span>
            </span>
          </Link>
        ))}

        <HeroDivider />
      </section>

      <section
        id="poruci"
        className="flex min-h-dvh flex-col justify-center bg-white px-4 py-14 sm:px-6 sm:py-16"
      >
        <div className="mx-auto w-full max-w-xl">
          <ServiceCards />

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

    </main>
    <AnnouncementBar />
    </>
  );
}

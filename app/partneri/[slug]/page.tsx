import Image from "next/image";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { ArrowDownIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { PartnerMenu } from "@/components/partners/partner-menu";
import { SiteNav } from "@/components/site-nav";
import { PARTNERS, findPartner } from "@/lib/partners";
import { heroButtonClass } from "@/lib/ui";

/*
 * Jedna stranica za sve restorane. Next pri objavi napravi po jednu gotovu
 * stranicu za svaki slug iz PARTNERS; slug kog nema na spisku daje 404.
 */
export function generateStaticParams() {
  return PARTNERS.map((partner) => ({ slug: partner.slug }));
}

export const dynamicParams = false;

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = findPartner(slug);
  if (!partner) notFound();

  return (
    <>
      <main>
        <SiteNav />

        <section className="hero-surface relative overflow-hidden px-4 pb-28 pt-28 text-center sm:pb-36 sm:pt-32">
          {/* Logo samo ako ga restoran ima — bez njega nema ni praznog mesta. */}
          {partner.logo ? (
            <div className="partner-logo mx-auto h-28 w-28 sm:h-36 sm:w-36">
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                width={316}
                height={316}
                priority
                className="h-full w-full rounded-full shadow-[0_8px_24px_rgba(60,4,0,0.35)]"
              />
            </div>
          ) : null}
          <h1 className="hero-title mt-5 font-display text-4xl font-black italic uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {partner.name}
          </h1>
          <p className="hero-description mx-auto mt-4 max-w-xl">{partner.tagline}</p>

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <MapPinIcon className="h-4 w-4" />
            {partner.address.street}, {partner.address.city}
          </p>

          {/*
            Dve različite stvari, dva dugmeta: glavno je porudžbina sa dostavom
            (meni ispod), sporedno je poziv restoranu za pitanja i preuzimanje.
          */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#meni" className={heroButtonClass}>
              Poruči sa dostavom
              <ArrowDownIcon className="h-5 w-5" />
            </a>
            <a
              href={`tel:${partner.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/70 px-6 py-3.5 font-display text-base font-extrabold text-white transition hover:bg-white/10"
            >
              <PhoneIcon className="h-5 w-5" />
              Pozovi restoran {partner.phone}
            </a>
          </div>
          <HeroDivider />
        </section>

        <PartnerMenu partner={partner} />

        <ContactStrip />
      </main>
      <AnnouncementBar />
    </>
  );
}

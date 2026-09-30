import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { ArrowDownIcon, ArrowRightIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { SiteNav } from "@/components/site-nav";
import { StructuredData } from "@/components/structured-data";
import {
  BUSINESS_ADDRESS,
  DISPLAY_PHONE,
  LOCATION_MAP_EMBED_URL,
  LOCATION_MAP_URL,
  TEL_URL,
  WORKING_HOURS_LABEL,
} from "@/lib/contact";
import { BUSINESS_NAME, publicMetadata } from "@/lib/seo";
import { heroButtonClass, secondaryButtonClass } from "@/lib/ui";

export const metadata = publicMetadata("/lokacija");

export default function LocationPage() {
  return (
    <>
      <SiteNav />
      <main>
        <StructuredData path="/lokacija" />
        <section className="hero-surface relative overflow-hidden px-4 pb-28 pt-36 text-center sm:pb-36 sm:pt-40" aria-labelledby="location-title">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-white">
            Lokacija i radno vreme
          </p>
          <h1 id="location-title" className="hero-title mt-5 font-display text-4xl font-black italic uppercase sm:text-6xl">
            Tu smo, u Jagodini.
          </h1>
          <p className="hero-description mx-auto mt-5 max-w-xl">
            Ti reci šta ti treba. Mi donosimo na tvoju adresu.
          </p>
          <a href="#lokacija-mapa" className={`${heroButtonClass} mt-8`}>
            Pogledaj mapu
            <ArrowDownIcon className="h-5 w-5" />
          </a>
          <HeroDivider />
        </section>

        <section id="lokacija-mapa" aria-labelledby="business-heading" className="scroll-mt-24 px-4 pb-16 pt-8 sm:pb-24 sm:pt-12">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
            <div className="py-2">
              <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-brand-dark">
                Tvoj Potrčko u komšiluku
              </p>
              <h2 id="business-heading" className="mt-3 font-display text-3xl font-black italic sm:text-4xl">
                {BUSINESS_NAME}
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600">
                Dostavljamo hranu, namirnice i druge potrepštine u Jagodini i do
                30 km oko grada. Napiši šta ti treba ili nam pošalji listu za
                kupovinu — mi donosimo na vrata. Poruči preko sajta ili telefonom.
              </p>

              <dl className="mt-7 divide-y divide-zinc-200 border-y border-zinc-200">
                <div className="py-5">
                  <dt className="text-sm font-semibold text-zinc-600">Adresa</dt>
                  <dd className="mt-1 flex items-center gap-2 font-display text-lg font-extrabold">
                    <MapPinIcon className="h-5 w-5 shrink-0 text-brand-dark" />
                    {BUSINESS_ADDRESS.streetAddress}, {BUSINESS_ADDRESS.addressLocality}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 py-5">
                  <div>
                    <dt className="text-sm font-semibold text-zinc-600">Radno vreme</dt>
                    <dd className="mt-1 font-display text-2xl font-extrabold">{WORKING_HOURS_LABEL}</dd>
                  </div>
                  <dd className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-brand-dark">Svakog dana</dd>
                </div>
                <div className="py-5">
                  <dt className="text-sm font-semibold text-zinc-600">Pozovi za porudžbinu</dt>
                  <dd className="mt-1">
                    <a href={TEL_URL} className="inline-flex items-center gap-2 rounded-sm font-display text-xl font-extrabold text-brand-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">
                      <PhoneIcon className="h-5 w-5" />
                      {DISPLAY_PHONE}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_60px_-30px_rgba(16,16,16,0.3)]">
              <iframe
                title={`Mapa zajedničke lokacije — ${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality}`}
                src={LOCATION_MAP_EMBED_URL}
                width="600"
                height="450"
                className="h-80 w-full border-0 bg-zinc-100 sm:h-[450px]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                aria-describedby="map-caption"
              />
              <div className="space-y-4 p-5 sm:p-6">
                <p id="map-caption" className="text-sm leading-relaxed text-zinc-600">
                  Delimo adresu sa Autoperionicom SMRK. Na Google mapi lokacija
                  je označena tim imenom.
                </p>
                <a href={LOCATION_MAP_URL} target="_blank" rel="noopener noreferrer" className={`${secondaryButtonClass} w-full gap-2 sm:w-auto`}>
                  Otvori u Google Maps
                  <ArrowRightIcon className="h-4 w-4" />
                  <span className="sr-only"> (novi tab)</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        <ContactStrip />
      </main>
      <AnnouncementBar />
    </>
  );
}

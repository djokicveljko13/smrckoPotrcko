import { PhoneIcon, ViberIcon, WhatsAppIcon } from "@/components/icons";
import {
  DISPLAY_PHONE,
  TEL_URL,
  VIBER_URL,
  WHATSAPP_URL,
} from "@/lib/contact";
import { secondaryButtonClass } from "@/lib/ui";

const actionClass = `${secondaryButtonClass} min-h-11 flex-1 gap-1.5 px-2 sm:px-4`;

/*
 * Puna širina, između forme i crvene trake na dnu — poslednja ponuda onome
 * ko ne voli da kuca u formu.
 * mt-auto: na visokom ekranu strip sedi na dnu viewporta, ne preko forme.
 *
 * <a> a ne next/link: tel:, wa.me i viber:// nisu rute u aplikaciji.
 * Link je za kretanje između naših stranica (prefetch); ovde bi smetao.
 */
export function ContactStrip() {
  return (
    <section
      className="mt-auto w-full border-t-2 border-zinc-100 bg-white"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-5 text-center sm:px-6 sm:py-6">
        <h2
          id="contact-heading"
          className="font-display text-lg font-black italic uppercase tracking-tight sm:text-xl"
        >
          Ne voliš forme? Pozovi nas.
        </h2>
        <a
          href={TEL_URL}
          className="mt-1 font-display text-2xl font-black italic tracking-tight text-brand sm:text-3xl"
        >
          {DISPLAY_PHONE}
        </a>
        <p className="mt-1 text-sm font-semibold text-zinc-500">
          Dostupni smo i na WhatsApp-u i Viber-u.
        </p>
        <div className="mt-4 flex w-full max-w-lg gap-2">
          <a href={TEL_URL} className={actionClass}>
            <PhoneIcon className="h-4 w-4" />
            Pozovi
          </a>
          <a
            href={WHATSAPP_URL}
            className={actionClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
          <a href={VIBER_URL} className={actionClass}>
            <ViberIcon />
            Viber
          </a>
        </div>
      </div>
    </section>
  );
}

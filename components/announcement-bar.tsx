import { DISPLAY_PHONE } from "@/lib/contact";

/*
 * Broj se ne prekucava — dolazi iz lib/contact.ts, isto mesto odakle ga čita
 * kontakt na dnu. Da se broj promeni, menja se na jednom mestu.
 */
const ANNOUNCEMENT =
  `Brza dostava u Jagodini i do 30 km oko grada • Naruči bilo šta • ` +
  `Mi trčimo umesto tebe • Poruči online ili pozovi ${DISPLAY_PHONE}`;

/*
 * Jedna polovina trake: poruka dva puta, da na širokom ekranu nema praznine.
 * pr-8 posle poslednje tačke = isti razmak kao gap-8 između delova, pa kad
 * animacija skoči sa kraja prve polovine na početak druge, oko ne vidi spoj.
 */
function TickerSegment() {
  return (
    <span className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8 text-xs font-bold uppercase tracking-wide sm:text-sm">
      <span>{ANNOUNCEMENT}</span>
      <span>•</span>
      <span>{ANNOUNCEMENT}</span>
      <span>•</span>
    </span>
  );
}

/*
 * Traka je sa vrha stranice preseljena na DNO. Gore je smetala: prva stvar
 * koju oko uhvati na crvenom heroju treba da bude logo i poruka, a ne tekst
 * koji beži u stranu. Na dnu je isto crvena, pa "zatvara" stranicu istom
 * bojom kojom je i počela.
 *
 * Zato je sada <footer>, a ne <aside>: to je poslednji, zajednički deo
 * stranice. Čitač ekrana ga tako i najavi ("footer"), umesto kao izdvojeno
 * obaveštenje sa strane.
 */
export function AnnouncementBar() {
  return (
    <footer
      aria-label="Obaveštenje"
      className="w-full min-w-0 overflow-hidden bg-brand text-white"
    >
      {/*
       * Čitač ekrana čita jednom. Kad OS traži manje animacije, isti pasus
       * postaje vidljiv (not-sr-only) — ticker ispod se tada gasi.
       */}
      <p className="sr-only px-4 py-2 text-center text-xs font-semibold leading-snug sm:text-sm motion-reduce:not-sr-only">
        {ANNOUNCEMENT}
      </p>

      <div
        className="flex h-10 items-center overflow-hidden motion-reduce:hidden sm:h-11"
        aria-hidden
      >
        <div className="flex w-max animate-marquee">
          <TickerSegment />
          <TickerSegment />
        </div>
      </div>
    </footer>
  );
}

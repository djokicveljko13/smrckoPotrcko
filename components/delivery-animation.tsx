import { BrandLogo } from "@/components/brand-logo";

/** Koliko traje ceo krug (2 kruga x 1.3s = 2.6s). Forma čita istu vrednost. */
export const ORBIT_MS = 2600;

const LAP_MS = ORBIT_MS / 2;

/*
 * Auto gleda UDESNO (u +x pravcu). To je bitno: overlay ga rotira da bi ga
 * okrenuo u pravcu kretanja, pa mora da se zna gde mu je "napred".
 */
function DeliveryCar() {
  return (
    <svg
      viewBox="0 0 148 80"
      className="h-16 w-28 drop-shadow-[0_6px_10px_rgba(16,16,16,0.25)] sm:h-20 sm:w-36"
      aria-hidden
    >
      {/* linije brzine iza auta */}
      <g
        stroke="#df352d"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.55"
      >
        <line x1="4" y1="26" x2="22" y2="26" />
        <line x1="0" y1="42" x2="16" y2="42" />
        <line x1="6" y1="58" x2="20" y2="58" />
      </g>

      {/* karoserija: visoki teretni deo + kraća njuška, debela crna kontura kao u logotipu */}
      <path
        d="M32 22 h56 l16 16 h22 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 H32 a6 6 0 0 1 -6 -6 V28 a6 6 0 0 1 6 -6 z"
        fill="#df352d"
        stroke="#101010"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* šoferšajbna */}
      <path
        d="M92 28 l12 12 h-12 z"
        fill="#ffffff"
        stroke="#101010"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* pruga na teretnom sanduku — mali eho crvene trake iz logotipa */}
      <rect x="38" y="34" width="44" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />

      {/* far */}
      <circle cx="128" cy="46" r="4" fill="#ffe08a" stroke="#101010" strokeWidth="3" />

      {/* točkovi */}
      <g stroke="#101010" strokeWidth="5">
        <circle cx="56" cy="62" r="11" fill="#101010" />
        <circle cx="114" cy="62" r="11" fill="#101010" />
      </g>
      <circle cx="56" cy="62" r="4" fill="#d4d4d8" />
      <circle cx="114" cy="62" r="4" fill="#d4d4d8" />
    </svg>
  );
}

/*
 * Kako auto pravi krug, bez ijedne linije JavaScripta za samo kretanje:
 *
 *   spoljni div  -> rotira se 0deg → 360deg oko centra ekrana
 *     unutrašnji -> pomeren je translateX(34vmin) od centra, tj. sedi na obodu
 *
 * Kad se roditelj vrti, dete koje je odgurnuto u stranu opisuje krug. Auto se
 * dodatno rotira za 90deg da bi gledao u pravcu vožnje, a ne u zid.
 *
 * vmin = manja od dve dimenzije ekrana, pa je krug isti i na uspravnom telefonu
 * i na širokom monitoru — nikad ne ispadne van ekrana.
 */
export function DeliveryAnimation() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white/95 backdrop-blur-sm"
      style={{ animation: "potrcko-fade-in 200ms ease-out" }}
      role="status"
      aria-live="polite"
    >
      {/* putanja po kojoj auto ide */}
      <div
        className="pointer-events-none absolute h-[68vmin] w-[68vmin] rounded-full border-2 border-dashed border-brand/20"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 motion-reduce:hidden"
        style={{ animation: `potrcko-orbit ${LAP_MS}ms linear infinite` }}
        aria-hidden
      >
        <div
          className="absolute"
          style={{
            transform: "translate(-50%, -50%) translateX(34vmin) rotate(90deg)",
          }}
        >
          <DeliveryCar />
        </div>
      </div>

      <div className="relative flex max-w-xs flex-col items-center px-6 text-center">
        <BrandLogo className="w-36 sm:w-44" />
        <p className="mt-5 font-display text-xl font-black italic uppercase tracking-tight">
          Krećemo po tvoju porudžbinu
        </p>
        <p className="mt-1.5 text-sm font-medium text-zinc-500">
          Upisujemo je na tablu…
        </p>
      </div>
    </div>
  );
}

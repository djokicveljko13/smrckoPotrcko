/*
 * Statična ilustracija za hero /kupovina: blok „Moja lista" prikucan selotejpom,
 * sa doodle korpom i kesom oko njega. Čisto ukras — aria-hidden, bez interakcije.
 *
 * Zašto puna roze + `opacity` na celom <svg>, a ne poluprovidan stroke:
 * poluprovidne linije se na mestima gde se preklapaju saberu i naprave tamnije
 * šavove. Ovako se ceo crtež nacrta neprozirno pa se JEDNOM stopi sa crvenom —
 * bez šavova, i dobije se onaj svetliji crveni ton iz dizajna.
 *
 * Primeri na papiru su namerno obične stavke iz marketa, ne generički „Mleko".
 */
const ROWS = [
  "Imlek Moja kravica mleko 1.5 l",
  "Persil prašak",
  "Coca cola zero 1l",
  "Chipsy čips",
];

export function ShoppingListArt() {
  return (
    <div className="relative mx-auto w-full max-w-[min(17rem,calc(100vw-9rem))] sm:max-w-xs" aria-hidden>
      {/* Doodle korpa — levo od papira, ne ispod njega. */}
      <ShoppingCartDoodle className="absolute right-full top-[42%] mr-3 h-14 w-14 -rotate-[18deg] text-[#ffb5ae] opacity-45 sm:mr-4 sm:h-24 sm:w-24" />
      {/* Doodle kesa sa namirnicama — desno dole. */}
      <GroceryBagDoodle className="absolute left-full bottom-5 ml-2 h-16 w-14 rotate-[14deg] text-[#ffb5ae] opacity-45 sm:bottom-8 sm:ml-3 sm:h-28 sm:w-24" />
      {/* Linije „pokreta" koje razbijaju praznu crvenu oko papira. */}
      <SpeedLines className="absolute right-full top-0 mr-2 h-14 w-10 text-[#ffb5ae] opacity-50 sm:mr-3 sm:h-16 sm:w-12" />
      <SpeedLines className="absolute left-full top-20 ml-3 h-12 w-9 -scale-x-100 text-[#ffb5ae] opacity-50 sm:ml-5 sm:h-14 sm:w-10" twoLines />

      {/* Papir. */}
      <div className="relative rotate-2 rounded-2xl bg-white px-6 py-7 shadow-[0_30px_60px_-18px_rgba(60,4,0,0.6)] sm:px-7">
        {/* Selotejp preko gornje ivice — bledoroze, vidi se i na belom i na crvenom. */}
        <span className="absolute -top-3.5 left-[56%] h-7 w-24 -translate-x-1/2 -rotate-6 rounded-[2px] bg-[#f3b0ab]/75" />

        <p className="font-hand text-3xl font-bold leading-none text-ink sm:text-4xl">
          Moja lista
        </p>
        <span className="mt-2 block h-[3px] w-32 rounded-full bg-brand" />

        <ul className="mt-6 space-y-3">
          {ROWS.map((label, index) => (
            <li key={index} className="flex items-end gap-3">
              <span className="mb-1.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-2 border-zinc-300" />
              {/*
                Tekst i linija su ISTI element: linija je donja ivica (border-b),
                pa reč uvek sedi na njoj kao u svesci.
              */}
              <span className="min-w-0 flex-1 border-b border-zinc-200 pb-1 font-hand text-base leading-snug text-ink sm:text-lg">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Kolica: ručka, korpa sa pregradama, dva točka. */
function ShoppingCartDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 16q3-3 10-1l13 43q1 4 6 4h45q5 0 6-5l7-34-71 1" />
      <path d="m35 25 5 35m14-36 2 37m17-37-2 37M25 39l64-1M29 51l57-1" />
      <path d="m34 63-7 9q-3 5 4 5l48-1q6 0 6 5" />
      <path d="m91 17 2-6 7-1" />
      <circle cx="38" cy="85" r="5" />
      <circle cx="75" cy="84" r="5" />
      <path d="m9 80-7 2m12 8-5 7" />
    </svg>
  );
}

/* Kesa iz marketa sa veknom, flašom i zeleni koji vire. */
function GroceryBagDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Namirnice završavaju na otvoru kese, bez linija kroz papir. */}
      <path d="M27 39 24 28c-9-1-12-8-6-9-5-7-1-11 4-7-1-11 5-12 7-3 5-6 10-3 7 3 8-1 9 5 2 8 4 5 0 10-7 9l2 10" />
      <path d="m28 18 2 20" />
      <path d="m43 40 1-13q0-5 6-8l1-10h8l-1 11q5 4 4 9l-1 12M51 13h8m-11 18 8 1" />
      <path d="M64 41c1-13 5-29 13-35 6-5 11-1 9 7l-9 29M76 14l7 3m-10 5 7 3m-10 5 7 3" />
      {/* Blago nepravilan obris kese daje utisak ručnog crteža. */}
      <path d="m19 39 62 2-2 50q0 5-5 5l-51-2q-5 0-5-5z" />
      <path d="m25 49-1 34m0 4v2m47-2 2 2m0-7v1" />
    </svg>
  );
}

/* Tri kratke crtice u lepezu — nagoveštaj brzine oko papira. */
function SpeedLines({ className, twoLines = false }: { className?: string; twoLines?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 50"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M29 15 18 2" />
      <path d="M22 27 3 19" />
      {!twoLines && <path d="M23 41 9 45" />}
    </svg>
  );
}

import { MapPinIcon } from "@/components/icons";

/**
 * Zašto ova sekcija postoji: forma kaže ŠTA radimo, crna traka ispod forme
 * kaže KOLIKO brzo. „O nama” odgovara na KO SMO — lokalni brend, ne lanac
 * iz drugog grada. To gradi poverenje pre nego što kupac ostavi telefon.
 *
 * Zašto NE tri bele kartice: već imamo badge traku. Još jedan grid kartica
 * bi izgledao kao marketing šablon. Jedna kompozicija, jedan posao.
 */
const LOCAL_POINTS = [
  {
    title: "Iz Jagodine",
    text: "Radimo ovde. Poznajemo ulice, radnje i ritam grada.",
  },
  {
    title: "Do 30 km oko grada",
    text: "Ceo grad i okolna mesta — bez „van zone” iznenađenja na vratima.",
  },
  {
    title: "Keš, na vratima",
    text: "Nema naloga, nema kartice u aplikaciji. Plaćaš kuriru.",
  },
];

export function AboutSection() {
  return (
    <section
      id="o-nama"
      aria-labelledby="about-heading"
      className="bg-ink px-4 py-14 text-white sm:px-6 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
            O nama
          </p>
          <h2
            id="about-heading"
            className="mt-3 max-w-xl font-display text-3xl font-black italic uppercase leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl"
          >
            Lokalni brend.
            <br />
            <span className="text-brand">Lokalni ljudi.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-zinc-300 sm:text-lg">
            Šmrčko Potrčko nije dostavna mreža iz drugog grada. Mi smo iz
            Jagodine — naruči šta ti treba, mi trčimo umesto tebe.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400">
            <MapPinIcon className="h-4 w-4 text-brand" />
            Jagodina i okolina
          </p>
        </div>

        <ul className="space-y-0 divide-y divide-dashed divide-white/15 border-t border-dashed border-white/15">
          {LOCAL_POINTS.map((point) => (
            <li key={point.title} className="py-4 first:pt-4 last:pb-0">
              <p className="font-display text-base font-black italic uppercase tracking-tight">
                {point.title}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-snug text-zinc-300">
                {point.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

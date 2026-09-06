import { SiteNav } from "@/components/site-nav";
import { HeroWave } from "@/components/hero-wave";
import { PartnershipForm } from "@/components/partnership-form";
import { heroButtonClass } from "@/lib/ui";

const OWN_COURIER_ITEMS = [
  "Plata svakog meseca, i kada ima manje dostava",
  "Troškovi goriva, registracije i održavanja vozila",
  "Organizovanje zamene za godišnji odmor i bolovanje",
  "Kapacitet ograničen brojem vaših kurira i vozila",
];
const PARTNERSHIP_ITEMS = [
  "Cena dostave prema dogovorenim uslovima",
  "Naša vozila i briga o njihovom održavanju",
  "Mi organizujemo kurire za vaše dostave",
  "Obim i termine dostave dogovaramo prema vašim potrebama",
];

const PARTNERSHIP_STEPS = [
  {
    number: "01",
    title: "Ostavite broj",
    description: "Popunite formu ili nas pozovite. Upit je bez obaveze.",
  },
  {
    number: "02",
    title: "Dogovorimo uslove",
    description:
      "Razgovaramo o broju dostava, terminima i ceni saradnje.",
  },
  {
    number: "03",
    title: "Počinjemo saradnju",
    description:
      "Kada dogovorimo detalje, krećemo sa dostavama za vaše kupce.",
  },
];
export default function PartnershipPage() {
  return (
    <main>
      <SiteNav />

      <section className="hero-surface relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-28 text-center sm:pb-36">
        <h1 className="hero-title font-display text-3xl font-black italic uppercase sm:text-5xl">
          Nemate svoju kurirsku službu?
          <br />
<span className="hero-title-accent">Mi trčimo za vas.</span>
        </h1>

    <p className="hero-description mt-5 max-w-2xl">
  Pekare, restorani, apoteke, cvećare, prodavnice. Vi radite svoj
  posao, mi dostavljamo vašim kupcima.
</p>
<a href="#saradnja-forma" className={`${heroButtonClass} mt-8`}>
  Dogovorimo saradnju
</a>
        <HeroWave />
      </section>
      <section className="px-4 py-16">
  <div className="mx-auto max-w-5xl">
    <h2 className="text-center font-display text-2xl font-extrabold sm:text-3xl">
      Svoj kurir ili naša dostava?
    </h2>

    <div className="mt-8 grid gap-6 sm:grid-cols-2">
      <article className="rounded-3xl bg-zinc-100 p-6 sm:p-8">
        <h3 className="font-display text-xl font-extrabold">
          Svoj kurir
        </h3>

        <ul className="mt-6 list-disc space-y-4 pl-5 text-zinc-700">
          {OWN_COURIER_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
<article className="rounded-3xl bg-ink p-6 text-white sm:p-8">
  <h3 className="font-display text-xl font-extrabold">
    Šmrčko Potrčko
  </h3>

  <ul className="mt-6 list-disc space-y-4 pl-5 text-zinc-200 marker:text-brand">
    {PARTNERSHIP_ITEMS.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</article>

    </div>
  </div>
</section>

<section className="px-4 py-16">
  <div className="mx-auto max-w-5xl">
    <h2 className="text-center font-display text-2xl font-extrabold sm:text-3xl">
      Kako počinjemo
    </h2>

    <div className="mt-8 grid gap-6 sm:grid-cols-3">
      {PARTNERSHIP_STEPS.map((step) => (
        <article
          key={step.number}
          className="rounded-3xl border border-zinc-200 p-6"
        >
          <span className="font-display text-5xl font-black italic text-brand">
            {step.number}
          </span>

          <h3 className="mt-4 font-display text-xl font-extrabold">
            {step.title}
          </h3>

          <p className="mt-2 text-zinc-600">
            {step.description}
          </p>
        </article>
      ))}
    </div>
  </div>
</section>
      <section
        id="saradnja-forma"
        className="scroll-mt-20 bg-white px-4 py-16"
      >
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
          <h2 className="font-display text-2xl font-extrabold">
            Ostavite broj, zovemo vas.
          </h2>
          <p className="mt-2 text-zinc-600">
            Bez obaveze. Čujemo se i vidimo da li vam se isplati.
          </p>

          <PartnershipForm />
        </div>
      </section>
    </main>




  );
}

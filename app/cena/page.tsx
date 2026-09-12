import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { ArrowRightIcon } from "@/components/icons";
import { PriceCalculatorForm } from "@/components/price-calculator-form";
import { SiteNav } from "@/components/site-nav";
import { heroButtonClass } from "@/lib/ui";

export const metadata = {
  title: "Izračunaj cenu dostave",
  description: "Piši odakle i dokle. Cena je ista kao kad poručiš.",
};

export default function PriceCalculatorPage() {
  return (
    <main>
      <SiteNav />

      <section className="hero-surface relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-28 text-center sm:pb-36">
        <h1 className="hero-title font-display text-3xl font-black italic uppercase sm:text-5xl">
          Izračunaj cenu dostave
        </h1>
      
        <a href="#cena-forma" className={`${heroButtonClass} mt-8`}>
          Izračunaj cenu
          <ArrowRightIcon className="h-5 w-5" />
        </a>
        <HeroDivider />
      </section>

      <section id="cena-forma" className="scroll-mt-20 bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
          <PriceCalculatorForm />
        </div>
      </section>

      <ContactStrip />
      <AnnouncementBar />
    </main>
  );
}

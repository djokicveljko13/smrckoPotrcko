import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { ArrowRightIcon } from "@/components/icons";
import { ShoppingListArt } from "@/components/shopping/shopping-list-art";
import { ShoppingOrderForm } from "@/components/shopping/shopping-order-form";
import { SiteNav } from "@/components/site-nav";
import { heroButtonClass } from "@/lib/ui";
import { publicMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";

export const metadata = publicMetadata("/kupovina");

export default function ShoppingPage() {
  return (
    <>
    <main>
      <StructuredData path="/kupovina" />
      <SiteNav />

      <section className="hero-surface relative flex min-h-[85vh] items-center overflow-hidden px-4 pb-28 pt-28 sm:pb-36 sm:pt-32">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div className="text-center lg:text-left">
            <h1 className="hero-title font-display text-4xl font-black italic uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Potrčko ide u kupovinu
            </h1>
            <p className="hero-description mx-auto mt-5 max-w-md lg:mx-0">
              Ti napiši listu, mi donosimo. Kupovina i dostava namirnica u Jagodini i okolini.
            </p>
            <a href="#kupovina-forma" className={`${heroButtonClass} mt-8`}>
              Napravi listu
              <ArrowRightIcon className="h-5 w-5" />
            </a>
          </div>

          <div className="flex justify-center">
            <ShoppingListArt />
          </div>
        </div>
        <HeroDivider />
      </section>

      <section id="kupovina-forma" className="scroll-mt-20 bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <ShoppingOrderForm />
        </div>
      </section>

      <ContactStrip />
    </main>
    <AnnouncementBar />
    </>
  );
}

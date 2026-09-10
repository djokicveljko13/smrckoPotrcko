import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { ShoppingOrderForm } from "@/components/shopping/shopping-order-form";
import { SiteNav } from "@/components/site-nav";

export const metadata = {
  title: "Potrčko ide u kupovinu",
  description: "Napiši listu — mi kupimo u marketu i donesemo na vrata.",
};

export default function ShoppingPage() {
  return (
    <main>
      <SiteNav />

      <section className="hero-surface relative flex min-h-[55vh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-28 text-center sm:pb-36">
        <h1 className="hero-title font-display text-3xl font-black italic uppercase sm:text-5xl">
          Potrčko ide u kupovinu
        </h1>
        <p className="hero-description mt-5 max-w-2xl">
          Napiši listu — mi kupimo i donesemo na vrata.
        </p>
        <HeroDivider />
      </section>

      <section id="kupovina-forma" className="scroll-mt-20 bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <ShoppingOrderForm />
        </div>
      </section>

      <ContactStrip />
      <AnnouncementBar />
    </main>
  );
}

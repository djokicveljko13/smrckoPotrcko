import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ContactStrip } from "@/components/contact-strip";
import { HeroDivider } from "@/components/hero-divider";
import { PartnerCheckout } from "@/components/partners/partner-checkout";
import { SiteNav } from "@/components/site-nav";
import { PARTNERS, findPartner } from "@/lib/partners";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Završi porudžbinu",
  robots: NO_INDEX,
};

export function generateStaticParams() {
  return PARTNERS.map((partner) => ({ slug: partner.slug }));
}

export const dynamicParams = false;

export default async function PartnerCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = findPartner(slug);
  if (!partner) notFound();

  return (
    <>
      <main>
        <SiteNav />

        <section className="hero-surface relative overflow-hidden px-4 pb-24 pt-28 text-center sm:pb-32 sm:pt-32">
          <h1 className="hero-title font-display text-4xl font-black italic uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Završi porudžbinu
          </h1>
          <p className="hero-description mx-auto mt-4 max-w-xl">{partner.name}</p>
          <HeroDivider />
        </section>

        <PartnerCheckout partner={partner} />

        <ContactStrip />
      </main>
      <AnnouncementBar />
    </>
  );
}

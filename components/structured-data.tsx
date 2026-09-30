import {
  BUSINESS_ADDRESS,
  CLOSING_TIME,
  E164_PHONE,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  OPENING_TIME,
} from "@/lib/contact";
import { BUSINESS_NAME, PUBLIC_PAGES, type PublicPath, siteUrl } from "@/lib/seo";

const businessId = siteUrl("/#organization");
const websiteId = siteUrl("/#website");
const areaServed = { "@type": "Place", name: "Jagodina i okolna mesta u krugu od 30 kilometara" };
const openingHours = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  opens: OPENING_TIME,
  closes: CLOSING_TIME,
};

export function StructuredData({ path }: { path: PublicPath }) {
  const page = PUBLIC_PAGES[path];
  const pageId = siteUrl(`${path}#webpage`);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "LocalBusiness",
      "@id": businessId,
      name: BUSINESS_NAME, url: siteUrl("/"),
      logo: siteUrl("/logo.png"), image: siteUrl("/opengraph-image"),
      description: PUBLIC_PAGES["/"].description,
      telephone: E164_PHONE, areaServed,
      address: {
        "@type": "PostalAddress",
        ...BUSINESS_ADDRESS,
      },
      sameAs: [FACEBOOK_URL, INSTAGRAM_URL],
      openingHoursSpecification: openingHours,
      contactPoint: {
        "@type": "ContactPoint", telephone: E164_PHONE,
        contactType: "customer service", availableLanguage: "sr-Latn", areaServed,
        hoursAvailable: openingHours,
      },
    },
    {
      "@type": "WebSite", "@id": websiteId, url: siteUrl("/"),
      name: BUSINESS_NAME, inLanguage: "sr-Latn", publisher: { "@id": businessId },
    },
    {
      "@type": "WebPage", "@id": pageId, url: siteUrl(path),
      name: page.title, description: page.description, inLanguage: "sr-Latn",
      isPartOf: { "@id": websiteId }, about: { "@id": businessId },
      ...(path !== "/" ? { breadcrumb: { "@id": siteUrl(`${path}#breadcrumb`) } } : {}),
    },
  ];

  if (path !== "/cena" && path !== "/lokacija") {
    graph.push({
      "@type": "Service", "@id": siteUrl(`${path}#service`),
      name: page.label, serviceType: page.label, description: page.description,
      url: siteUrl(path), provider: { "@id": businessId }, areaServed,
      mainEntityOfPage: { "@id": pageId },
    });
  }

  if (path !== "/") {
    graph.push({
      "@type": "BreadcrumbList", "@id": siteUrl(`${path}#breadcrumb`),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BUSINESS_NAME, item: siteUrl("/") },
        { "@type": "ListItem", position: 2, name: page.label, item: siteUrl(path) },
      ],
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }}
    />
  );
}

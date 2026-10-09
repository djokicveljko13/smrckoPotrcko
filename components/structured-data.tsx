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

// JSON-LD prati pravopis Google profila; tekst stranice i meta oznake ostaju sa dijakritikom.
const SCHEMA_NAME = "Smrko Potrcko";
const SCHEMA_STREET_ADDRESS = "Kneza Milosa 24";

function profileSpelling(text: string): string {
  return text
    .replaceAll(BUSINESS_NAME, SCHEMA_NAME)
    .replaceAll(BUSINESS_ADDRESS.streetAddress, SCHEMA_STREET_ADDRESS);
}

export function StructuredData({ path }: { path: PublicPath }) {
  const page = PUBLIC_PAGES[path];
  const pageId = siteUrl(`${path}#webpage`);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "LocalBusiness",
      "@id": businessId,
      name: SCHEMA_NAME, url: siteUrl("/"),
      logo: siteUrl("/logo.png"), image: siteUrl("/opengraph-image"),
      description: PUBLIC_PAGES["/"].description,
      telephone: E164_PHONE, areaServed,
      address: {
        "@type": "PostalAddress",
        streetAddress: SCHEMA_STREET_ADDRESS,
        addressLocality: BUSINESS_ADDRESS.addressLocality,
        postalCode: "35000",
        addressCountry: BUSINESS_ADDRESS.addressCountry,
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
      name: SCHEMA_NAME, inLanguage: "sr-Latn", publisher: { "@id": businessId },
    },
    {
      "@type": "WebPage", "@id": pageId, url: siteUrl(path),
      name: profileSpelling(page.title), description: profileSpelling(page.description), inLanguage: "sr-Latn",
      isPartOf: { "@id": websiteId }, about: { "@id": businessId },
      ...(path !== "/" ? { breadcrumb: { "@id": siteUrl(`${path}#breadcrumb`) } } : {}),
    },
  ];

  if (path !== "/cena" && path !== "/lokacija") {
    graph.push({
      "@type": "Service", "@id": siteUrl(`${path}#service`),
      name: page.label, serviceType: page.label, description: profileSpelling(page.description),
      url: siteUrl(path), provider: { "@id": businessId }, areaServed,
      mainEntityOfPage: { "@id": pageId },
    });
  }

  if (path !== "/") {
    graph.push({
      "@type": "BreadcrumbList", "@id": siteUrl(`${path}#breadcrumb`),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SCHEMA_NAME, item: siteUrl("/") },
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

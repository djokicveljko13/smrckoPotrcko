import type { Metadata } from "next";
import { BUSINESS_ADDRESS, DISPLAY_PHONE, WORKING_HOURS_LABEL } from "@/lib/contact";

export const BUSINESS_NAME = "Šmrčko Potrčko";

// SEO domen je odvojen od lokalnih/preview linkova za rad aplikacije.
function canonicalOrigin(): string {
  const url = new URL(process.env.SITE_URL?.trim() || "https://smrckopotrcko.rs");
  if (
    url.protocol !== "https:" || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash || url.port ||
    url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
    url.hostname === "127.0.0.1" || url.hostname === "[::1]"
  ) {
    throw new Error("SITE_URL mora biti javni HTTPS domen, bez putanje i parametara.");
  }
  return url.origin;
}

export const SITE_URL = canonicalOrigin();
export const IS_PREVIEW = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

export const PUBLIC_PAGES = {
  "/": {
    title: "Dostava u Jagodini | Šmrčko Potrčko",
    description: `Hrana, namirnice, apoteka ili bilo šta drugo. Dostava u Jagodini i do 30 km oko grada. Poruči online ili pozovi ${DISPLAY_PHONE}, svaki dan ${WORKING_HOURS_LABEL}.`,
    label: "Dostava u Jagodini",
  },
  "/kupovina": {
    title: "Kupovina i dostava namirnica u Jagodini | Šmrčko Potrčko",
    description: "Ti napiši listu, mi kupimo u marketu i donesemo na vrata. Izaberi Maxi, Rodu, IDEA ili Lidl. Šmrčko Potrčko ide u kupovinu za tebe u Jagodini.",
    label: "Kupovina namirnica",
  },
  "/cena": {
    title: "Cena dostave u Jagodini – kalkulator | Šmrčko Potrčko",
    description: "Izračunaj cenu dostave u Jagodini i okolini pre porudžbine. Izaberi odakle preuzimamo i gde donosimo. Cena je ista kao kad poručiš.",
    label: "Cena dostave",
  },
  "/saradnja": {
    title: "Dostava za firme u Jagodini | Šmrčko Potrčko",
    description: `Dostava za pravna lica u Jagodini i okolini: danas za odmah, danas za danas ili po ugovoru. Dogovorite dugoročnu saradnju na ${DISPLAY_PHONE}.`,
    label: "Dostava za firme",
  },
  "/lokacija": {
    title: "Lokacija i radno vreme | Šmrčko Potrčko Jagodina",
    description: `Šmrčko Potrčko — ${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality}. Dostava u Jagodini i okolini, svakog dana ${WORKING_HOURS_LABEL}. Pozovi ${DISPLAY_PHONE}.`,
    label: "Lokacija",
  },
} as const;

export type PublicPath = keyof typeof PUBLIC_PAGES;

export function siteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

// Privatne stranice nasleđuju ovo; samo javne izričito uključuju indeksiranje.
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

export function publicMetadata(path: PublicPath): Metadata {
  const { title, description } = PUBLIC_PAGES[path];
  return {
    title,
    description,
    alternates: { canonical: siteUrl(path) },
    robots: IS_PREVIEW ? NO_INDEX : {
      index: true,
      follow: true,
      googleBot: {
        index: true, follow: true,
        "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website", locale: "sr_RS", siteName: BUSINESS_NAME,
      url: siteUrl(path), title, description,
      images: [{ url: siteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Šmrčko Potrčko — dostava u Jagodini i okolini" }],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: [{ url: siteUrl("/opengraph-image"), alt: "Šmrčko Potrčko — dostava u Jagodini i okolini" }],
    },
  };
}

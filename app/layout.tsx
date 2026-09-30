import type { Metadata } from "next";
import { Archivo, Caveat, Plus_Jakarta_Sans } from "next/font/google";
import { CallFab } from "@/components/call-fab";
import { BUSINESS_NAME, NO_INDEX, SITE_URL } from "@/lib/seo";
import "./globals.css";

/*
 * Tri pisma, svako sa svojim poslom:
 * - Archivo (težak, italic) za naslove — rimuje se sa kosim slovima iz logotipa.
 * - Plus Jakarta Sans za tekst i dugmad — moderan, okrugao, čita se na telefonu.
 * - Caveat za rukopisne detalje (npr. „Moja lista" na ilustraciji /kupovina).
 * latin-ext je OBAVEZAN, inače š, č, ć, ž i đ ispadnu iz pisma.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  // Rukopis nije iznad prevoja na većini strana; učitava se kada je potreban.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: BUSINESS_NAME,
  applicationName: BUSINESS_NAME,
  robots: NO_INDEX,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      className={`${archivo.variable} ${jakarta.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans text-ink">
        {children}
        <CallFab />
      </body>
    </html>
  );
}

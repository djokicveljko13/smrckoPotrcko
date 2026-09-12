import type { Metadata } from "next";
import { Archivo, Caveat, Plus_Jakarta_Sans } from "next/font/google";
import { CallFab } from "@/components/call-fab";
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
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Šmrčko Potrčko dostava",
  description:
    "Naruči bilo šta iz bilo koje radnje. Kurir donosi, plaćaš kešom na vrata.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr"
      className={`${archivo.variable} ${jakarta.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans text-ink">
        {children}
        <CallFab />
      </body>
    </html>
  );
}

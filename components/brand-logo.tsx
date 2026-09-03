import Image from "next/image";
import logo from "@/public/logo.png";

type Props = {
  /** Veličina se zadaje CSS-om, npr. "w-64". Ne prop-om width. */
  className?: string;
  priority?: boolean;
};

/*
 * next/image + statični import: Next iz samog fajla pročita pravu širinu i
 * visinu (1200x583), pa browser rezerviše mesto pre nego što se slika skine.
 * Bez toga stranica poskoči kad logo stigne.
 *
 * Zato NE prosleđujemo width/height — to su po dokumentaciji "intrinzične"
 * dimenzije iz kojih se računa odnos stranica. Ako bismo poslali samo width,
 * odnos bi se pokvario i logo bi bio spljošten. Prikazanu veličinu daje CSS.
 *
 * priority stavi samo na logo koji se vidi odmah (početna) — tada ga Next skida
 * odmah umesto lenjo.
 */
export function BrandLogo({ className, priority = false }: Props) {
  return (
    <Image
      src={logo}
      alt="Šmrčko Potrčko — mi trčimo umesto Vas"
      sizes="(max-width: 640px) 75vw, 340px"
      priority={priority}
      className={className}
    />
  );
}

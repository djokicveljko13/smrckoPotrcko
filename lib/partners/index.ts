import { crispyChickenKorner } from "@/lib/partners/crispy-chicken-korner";
import type { Partner } from "@/lib/partners/types";

/**
 * Svi restorani partneri. Novi partner = novi fajl u ovom folderu + jedan red
 * ovde; stranica, početna i server ga onda vide sami.
 */
export const PARTNERS: Partner[] = [crispyChickenKorner];

/** Nepoznat slug vraća null — URL je mogao biti izmišljen. */
export function findPartner(slug: unknown) {
  return PARTNERS.find((partner) => partner.slug === slug) ?? null;
}

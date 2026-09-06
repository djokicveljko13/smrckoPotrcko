/**
 * Cena dostave se računa iz stvarne kilometraže (firma → kupac).
 * Formula je dogovorena sa klijentom, izvor istine: docs/featureGoogleMaps.md.
 *
 *   osnovica = 30 + 80 din/km, zaokruženo NAVIŠE na 10 dinara
 *   konačna cena = cenovni razred 180 / 200 / 220 / 250 / 300 din
 */

export const PRICE_BASE_DIN = 30;
export const PRICE_PER_KM_DIN = 80;

/**
 * Polazna tačka svake dostave: Кнеза Милоша 24, Јагодина.
 * Geokodirano jednom, ručno (Google Maps, desni klik na tačku) — adresa firme
 * se ne menja, pa je konstanta a ne env promenljiva (env bi mogao tiho da se
 * razlikuje između lokala i Vercela).
 */
export const PICKUP = { latitude: 43.978_143, longitude: 21.268_273 } as const;

/**
 * Metri koje vrati Google Routes → osnovica → konačna cena u dinarima.
 * Razred biramo po zaokruženoj osnovici, samo jednom.
 *
 *   1.5 km → osnovica 150 → konačno 200 din
 *   3.7 km → osnovica 330 → konačno 300 din
 */
export function deliveryPriceFromMeters(meters: number): number {
  const km = meters / 1000;
  const raw = PRICE_BASE_DIN + PRICE_PER_KM_DIN * km;
  const rounded = Math.ceil(raw / 10) * 10;

  if (rounded < 50) return 180;
  if (rounded <= 150) return 200;
  if (rounded <= 220) return 220;
  if (rounded <= 250) return 250;
  return 300;
}

/** Cena za prikaz: 330 → "330 dinara". */
export function deliveryPriceLabel(price: number): string {
  return `${price} dinara`;
}

/** Razdaljina za prikaz: 4200 → "4.2 km". */
export function distanceLabel(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Cena dostave se računa iz stvarne kilometraže (firma → kupac).
 * Formula je dogovorena sa klijentom, izvor istine: docs/featureGoogleMaps.md.
 *
 *   cena = start(razdaljina) + 80 din/km
 *   start: <5 km → 100, 5–10 → 200, 10–15 → 300, preko 15 → 400
 *
 * Kupovina iz marketa se ovde ne računa — vidi SHOPPING_STORES ispod.
 */

export const PRICE_PER_KM_DIN = 80;
export const START_FEE_UNDER_5KM_DIN = 100;
export const START_FEE_5_TO_10KM_DIN = 200;
export const START_FEE_10_TO_15KM_DIN = 300;
export const START_FEE_OVER_15KM_DIN = 400;

/**
 * Polazna tačka svake dostave: Кнеза Милоша 24, Јагодина.
 * Geokodirano jednom, ručno (Google Maps, desni klik na tačku) — adresa firme
 * se ne menja, pa je konstanta a ne env promenljiva (env bi mogao tiho da se
 * razlikuje između lokala i Vercela).
 */
export const PICKUP = { latitude: 43.978_143, longitude: 21.268_273 } as const;

/** Start po razdaljini. Tačno 5 km ide u 200, tačno 10 km u 300, tačno 15 km u 300. */
export function startFeeFromKm(km: number): number {
  if (km < 5) return START_FEE_UNDER_5KM_DIN;
  if (km < 10) return START_FEE_5_TO_10KM_DIN;
  if (km <= 15) return START_FEE_10_TO_15KM_DIN;
  return START_FEE_OVER_15KM_DIN;
}

/**
 * Metri koje vrati Google Routes → konačna cena u dinarima.
 *
 *   1.6 km → 100 + 128 = 228 din
 *   5 km   → 200 + 400 = 600 din
 *   10 km  → 300 + 800 = 1100 din
 */
export function deliveryPriceFromMeters(meters: number): number {
  const km = meters / 1000;
  return Math.round(startFeeFromKm(km) + PRICE_PER_KM_DIN * km);
}

/** Cena za prikaz: 330 → "330 dinara". */
export function deliveryPriceLabel(price: number): string {
  return `${price} dinara`;
}

/** Razdaljina za prikaz: 4200 → "4.2 km". */
export function distanceLabel(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Kupovina iz marketa ima fiksnu cenu dogovorenu po lancu — kilometraža se
 * ne računa. Lidl je duplo skuplji (dogovor sa klijentom, 07.09.2026).
 *
 * `as const` daje TypeScript-u tačan skup id-jeva, pa ShoppingStore ne može
 * da odluta od ove liste.
 */
export const SHOPPING_STORES = [
  { id: "maxi", label: "Maxi", price: 500, logo: "/prodavnice/maxi.jpg" },
  { id: "roda", label: "Roda", price: 500, logo: "/prodavnice/roda.jpg" },
  { id: "idea", label: "IDEA", price: 500, logo: "/prodavnice/idea.jpg" },
  { id: "lidl", label: "Lidl", price: 1000, logo: "/prodavnice/lidl.webp" },
] as const;

export type ShoppingStore = (typeof SHOPPING_STORES)[number]["id"];

/** Nepoznat id vraća null — forma je mogla biti falsifikovana. */
export function findShoppingStore(id: unknown) {
  return SHOPPING_STORES.find((s) => s.id === id) ?? null;
}

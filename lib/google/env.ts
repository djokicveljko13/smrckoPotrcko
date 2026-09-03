/**
 * Google Maps Platform ključ. Server only — nema `NEXT_PUBLIC_` prefiks, pa
 * nikad ne stigne u browser (isto pravilo kao SUPABASE_SERVICE_ROLE_KEY).
 *
 * Vraća null umesto da baca: Google je „lepo za imati", ne „bez ovoga ne radi".
 * Porudžbina sme da prođe i kad ključa nema (cena ostane NULL).
 */
export function googleMapsApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

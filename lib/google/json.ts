/**
 * Sitne provere za JSON koji stiže od Google-a. Ništa se ne veruje unapred —
 * svaka funkcija vraća ili traženu vrednost ili null, pa pozivalac ide korak po
 * korak umesto da odjednom napiše `data.a.b.c` i pukne kad nešto fali.
 */

/** Pravi objekat (ne null, ne niz)? Vrati ga kao mapu ključ → nepoznata vrednost. */
export function asObject(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Neprazan string? */
export function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Konačan broj (ne NaN, ne Infinity)? */
export function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

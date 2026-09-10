/** Deljeni helperi za gostujuće forme (dostava i kupovina). Bez baze i bez cene. */

import { readOrderValue } from "@/lib/order-signing";

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function validText(value: unknown, max: number, optional = false): value is string {
  return typeof value === "string" && value.length <= max && (optional || value.trim().length > 0);
}

export function validPhone(value: unknown): value is string {
  return validText(value, 40) && /^[+\d\s()/-]+$/.test(value) && value.replace(/\D/g, "").length >= 6;
}

export function readPlace(token: string, text: string, max: number) {
  const place = asRecord(readOrderValue(token, "place"));
  if (!place || !validText(place.placeId, 300) || !validText(place.text, max) || place.text !== text) {
    return null;
  }
  return { placeId: place.placeId as string, text: place.text as string };
}

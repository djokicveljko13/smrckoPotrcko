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

export const QUOTE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** create_*_order vraća { public_number, created }; created = false znači ponovljenu ponudu. */
export function readCreatedOrder(data: unknown): { ticket: string; created: boolean } | null {
  const row = asRecord(data);
  if (!row || typeof row.public_number !== "string" || typeof row.created !== "boolean") return null;
  return { ticket: row.public_number, created: row.created };
}

/** Ista granica kao napomena na kupovini. */
export const MAX_ORDER_NOTE = 500;

export function readPlace(token: string, text: string, max: number) {
  const place = asRecord(readOrderValue(token, "place"));
  if (!place || !validText(place.placeId, 300) || !validText(place.text, max) || place.text !== text) {
    return null;
  }
  return { placeId: place.placeId as string, text: place.text as string };
}

/**
 * Nacrt adresa sa `/cena` za javnu formu.
 *
 * Zašto sessionStorage, ne URL: u polju već stoji HMAC potpis predloga.
 * URL bi ga ostavio u istoriji i na deljenom linku. sessionStorage živi samo
 * u ovom tabu i briše se čim forma ga pročita.
 */
export type DraftPlaces = {
  shop: string;
  shopSelection: string;
  address: string;
  addressSelection: string;
};

const KEY = "potrcko-order-places";

function asTrimmed(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
    ? value
    : null;
}

export function parseDraftPlaces(value: unknown): DraftPlaces | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const shop = asTrimmed(record.shop, 300);
  const shopSelection = asTrimmed(record.shopSelection, 20_000);
  const address = asTrimmed(record.address, 400);
  const addressSelection = asTrimmed(record.addressSelection, 20_000);
  if (!shop || !shopSelection || !address || !addressSelection) return null;
  return { shop, shopSelection, address, addressSelection };
}

export function saveDraftPlaces(draft: DraftPlaces) {
  if (typeof sessionStorage === "undefined") return;
  const parsed = parseDraftPlaces(draft);
  if (!parsed) return;
  sessionStorage.setItem(KEY, JSON.stringify(parsed));
}

export function readDraftPlaces(): DraftPlaces | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return parseDraftPlaces(JSON.parse(raw));
  } catch {
    return null;
  }
}

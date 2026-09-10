import { readOrderValue, signOrderValue } from "@/lib/order-signing";
import { findShoppingStore, type ShoppingStore } from "@/lib/pricing";
import {
  asRecord,
  readPlace,
  readString,
  validPhone,
  validText,
} from "@/lib/order-validation";
import {
  MAX_SHOPPING_NOTE,
  normalizeItems,
} from "@/lib/shopping";

export const SHOPPING_QUOTE_TTL_MS = 15 * 60 * 1000;

const CHOOSE_ADDRESS = "Izaberi adresu iz ponuđene liste.";
const CHOOSE_STORE = "Izaberi market u kom kupujemo.";
const NEED_ITEMS = "Upiši bar jednu stavku na listu (najviše 30).";

export type ShoppingField = "store" | "items" | "note" | "address" | "address_details" | "phone";

export type ShoppingQuote = {
  store: ShoppingStore;
  storeLabel: string;
  items: string[];
  note: string;
  address: string;
  addressDetails: string;
  phone: string;
  destinationPlaceId: string;
  price: number;
  expiresAt: number;
};

export type PrepareShoppingResult =
  | { status: "ok"; quote: ShoppingQuote; token: string }
  | { status: "error"; message: string; fields?: Partial<Record<ShoppingField, string>> };

export type CreateShoppingOrderState =
  | { status: "ok"; ticket: string; price: number }
  | { status: "error"; message: string; expired?: boolean }
  | null;

function readItemsFromForm(formData: FormData): string[] | null {
  const raw = formData.getAll("items");
  return normalizeItems(raw.map((value) => (typeof value === "string" ? value : "")));
}

function isShoppingQuote(value: unknown): value is ShoppingQuote {
  const quote = asRecord(value);
  if (!quote) return false;
  const store = findShoppingStore(quote.store);
  if (!store) return false;
  const items = normalizeItems(quote.items);
  return Boolean(
    items &&
      quote.store === store.id &&
      quote.storeLabel === store.label &&
      quote.price === store.price &&
      validText(quote.note, MAX_SHOPPING_NOTE, true) &&
      validText(quote.address, 400) &&
      validText(quote.addressDetails, 150, true) &&
      validPhone(quote.phone) &&
      validText(quote.destinationPlaceId, 300) &&
      typeof quote.expiresAt === "number" &&
      Number.isSafeInteger(quote.expiresAt),
  );
}

/** Nema baze ni Telegrama: samo privremena potpisana ponuda. */
export async function prepareShoppingQuote(
  formData: FormData,
  now: () => number = Date.now,
): Promise<PrepareShoppingResult> {
  const store = findShoppingStore(readString(formData, "store"));
  const items = readItemsFromForm(formData);
  const note = readString(formData, "note");
  const phone = readString(formData, "phone");
  const addressDetails = readString(formData, "address_details");
  const address = readPlace(
    readString(formData, "address_selection"),
    readString(formData, "address"),
    400,
  );

  const fields: Partial<Record<ShoppingField, string>> = {};
  if (!store) fields.store = CHOOSE_STORE;
  if (!items) fields.items = NEED_ITEMS;
  if (!validText(note, MAX_SHOPPING_NOTE, true)) {
    fields.note = `Napomena može imati najviše ${MAX_SHOPPING_NOTE} znakova.`;
  }
  if (!validPhone(phone)) fields.phone = "Upiši ispravan broj telefona (najmanje 6 cifara).";
  if (!validText(addressDetails, 150, true)) {
    fields.address_details = "Detalji adrese mogu imati najviše 150 znakova.";
  }
  if (!address) fields.address = CHOOSE_ADDRESS;

  if (Object.keys(fields).length || !store || !items || !address) {
    return { status: "error", message: "Proveri označena polja.", fields };
  }

  const quote: ShoppingQuote = {
    store: store.id,
    storeLabel: store.label,
    items,
    note,
    address: address.text,
    addressDetails,
    phone,
    destinationPlaceId: address.placeId,
    price: store.price,
    expiresAt: now() + SHOPPING_QUOTE_TTL_MS,
  };

  return { status: "ok", quote, token: signOrderValue("shopping", quote) };
}

/** Upis dobija isključivo proverene podatke iz potpisane ponude. */
export async function confirmShoppingQuote(
  token: string,
  insert: (quote: ShoppingQuote) => Promise<string | null>,
  notify: (ticket: string) => Promise<void>,
  now: () => number = Date.now,
): Promise<Exclude<CreateShoppingOrderState, null>> {
  const quote = readOrderValue(token, "shopping");
  if (!isShoppingQuote(quote)) {
    return { status: "error", message: "Pregled porudžbine nije važeći. Ponovo proveri podatke.", expired: true };
  }
  if (quote.expiresAt <= now()) {
    return { status: "error", message: "Ponuda je istekla. Ponovo pošalji listu pre potvrde.", expired: true };
  }
  const ticket = await insert(quote);
  if (!ticket || !/^P-\d+$/.test(ticket)) {
    return { status: "error", message: "Porudžbina nije upisana. Pokušaj ponovo ili nas pozovi." };
  }
  try {
    await notify(ticket);
  } catch {
    console.error("Shopping order notification failed");
  }
  return { status: "ok", ticket, price: quote.price };
}

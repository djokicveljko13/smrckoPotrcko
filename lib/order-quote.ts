import { readOrderValue, signOrderValue } from "@/lib/order-signing";
import { deliveryPriceFromMeters } from "@/lib/pricing";
import {
  asRecord,
  readPlace,
  readString,
  validPhone,
  validText,
} from "@/lib/order-validation";
import type { CreateGuestOrderState, OrderDetails, OrderField, OrderQuote, PrepareOrderResult } from "@/lib/order-types";

export const QUOTE_TTL_MS = 15 * 60 * 1000;
const CHOOSE_ADDRESS = "Izaberi adresu iz ponuđene liste.";

/** Nema baze ni Telegrama u ovoj funkciji: rezultat je samo privremena ponuda. */
export async function prepareOrderQuote(
  formData: FormData,
  distance: (placeId: string) => Promise<number | null>,
  now: () => number = Date.now,
): Promise<PrepareOrderResult> {
  const title = readString(formData, "title");
  const phone = readString(formData, "phone");
  const addressDetails = readString(formData, "address_details");
  const shop = readPlace(readString(formData, "shop_selection"), readString(formData, "shop"), 300);
  const address = readPlace(readString(formData, "address_selection"), readString(formData, "address"), 400);
  const fields: Partial<Record<OrderField, string>> = {};
  if (!validText(title, 500)) fields.title = "Upiši šta naručuješ, najviše 500 znakova.";
  if (!validPhone(phone)) fields.phone = "Upiši ispravan broj telefona (najmanje 6 cifara).";
  if (!validText(addressDetails, 150, true)) fields.address_details = "Detalji adrese mogu imati najviše 150 znakova.";
  if (!shop) fields.shop = CHOOSE_ADDRESS;
  if (!address) fields.address = CHOOSE_ADDRESS;
  if (Object.keys(fields).length || !shop || !address) {
    return { status: "error", message: "Proveri označena polja.", fields };
  }

  const distanceM = await distance(address.placeId);
  if (distanceM === null || !Number.isSafeInteger(distanceM) || distanceM < 0 || distanceM > 2_147_483_647) {
    return { status: "error", message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi." };
  }
  const quote: OrderQuote = {
    order: { title, shop: shop.text, address: address.text, addressDetails, phone, destinationPlaceId: address.placeId },
    distanceM,
    price: deliveryPriceFromMeters(distanceM),
    expiresAt: now() + QUOTE_TTL_MS,
  };
  return { status: "ok", quote, token: signOrderValue("quote", quote) };
}

function isOrderDetails(value: unknown): value is OrderDetails {
  const order = asRecord(value);
  return Boolean(order && validText(order.title, 500) && validText(order.shop, 300) &&
    validText(order.address, 400) && validText(order.addressDetails, 150, true) &&
    validPhone(order.phone) && validText(order.destinationPlaceId, 300));
}

function isQuote(value: unknown): value is OrderQuote {
  const quote = asRecord(value);
  return Boolean(quote && isOrderDetails(quote.order) &&
    typeof quote.distanceM === "number" && Number.isSafeInteger(quote.distanceM) &&
    quote.distanceM >= 0 && quote.distanceM <= 2_147_483_647 &&
    typeof quote.price === "number" && Number.isSafeInteger(quote.price) && quote.price > 0 &&
    typeof quote.expiresAt === "number" && Number.isSafeInteger(quote.expiresAt));
}

/** Upis dobija isključivo proverene podatke iz potpisane ponude. */
export async function confirmOrderQuote(
  token: string,
  insert: (quote: OrderQuote) => Promise<string | null>,
  notify: (ticket: string) => Promise<void>,
  now: () => number = Date.now,
): Promise<Exclude<CreateGuestOrderState, null>> {
  const quote = readOrderValue(token, "quote");
  if (!isQuote(quote)) {
    return { status: "error", message: "Pregled porudžbine nije važeći. Ponovo proveri cenu.", expired: true };
  }
  if (quote.expiresAt <= now()) {
    return { status: "error", message: "Cena je istekla. Ponovo proveri cenu pre potvrde.", expired: true };
  }
  const ticket = await insert(quote);
  if (!ticket || !/^P-\d+$/.test(ticket)) {
    return { status: "error", message: "Porudžbina nije upisana. Pokušaj ponovo ili nas pozovi." };
  }
  // Upis je završen. Greška obaveštenja ne sme kupcu sugerisati da šalje ponovo.
  try { await notify(ticket); } catch { console.error("Order notification failed"); }
  return { status: "ok", ticket, price: quote.price };
}

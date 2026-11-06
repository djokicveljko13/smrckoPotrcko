"use server";

import { randomUUID } from "node:crypto";
import { computeDistanceMeters } from "@/lib/google/routes";
import { notifyNewOrder } from "@/lib/notify-new-order";
import { readOrderValue, signOrderValue } from "@/lib/order-signing";
import {
  asRecord,
  readCreatedOrder,
  readPlace,
  readString,
  validPhone,
  validText,
} from "@/lib/order-validation";
import { findPartner } from "@/lib/partners";
import { MAX_QUANTITY } from "@/lib/partners/cart";
import { deliveryPriceFromMeters } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const OFFER_VALID_MS = 15 * 60 * 1000;

/** Dostava koju je kupac video. Potpisana je, pa je browser ne može izmeniti. */
type DeliveryOffer = {
  id: string; // ista ponuda poslata dvaput pravi samo jednu porudžbinu
  placeId: string;
  address: string;
  price: number;
  distanceM: number;
  expiresAt: number;
};

/** Računa dostavu do izabrane adrese. Vraća null ako adresa ili Google zakažu. */
export async function estimatePartnerDelivery(formData: FormData) {
  const address = readPlace(
    readString(formData, "address_selection"),
    readString(formData, "address"),
    400,
  );
  if (!address) return null;

  const distanceM = await computeDistanceMeters(address.placeId);
  if (distanceM === null) return null;

  const offer: DeliveryOffer = {
    id: randomUUID(),
    placeId: address.placeId,
    address: address.text,
    price: deliveryPriceFromMeters(distanceM),
    distanceM,
    expiresAt: Date.now() + OFFER_VALID_MS,
  };

  return { price: offer.price, token: signOrderValue("partner", offer) };
}

type PartnerOrderInput = {
  slug: string;
  cart: Record<string, number>;
  deliveryToken: string;
  addressDetails: string;
  phone: string;
};

/**
 * Upisuje porudžbinu i javlja kuriru i vlasniku. Sve što stiže iz browsera se
 * proverava, a cene hrane se uzimaju iz menija na serveru.
 */
export async function createPartnerOrder(input: PartnerOrderInput) {
  const partner = findPartner(input.slug);
  const cart = asRecord(input.cart);
  if (!partner || !cart) return orderError("Porudžbina nije važeća. Vrati se na meni.");

  if (!validText(input.addressDetails, 150, true)) return orderError("Ulaz, sprat i stan mogu imati najviše 150 znakova.");
  if (!validPhone(input.phone)) return orderError("Upiši ispravan broj telefona.");

  const itemTexts: string[] = [];
  let foodTotal = 0;
  for (const item of partner.menu) {
    const quantity = cart[item.id] ?? 0;
    if (quantity === 0) continue;
    if (!Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > MAX_QUANTITY) {
      return orderError("Količina u korpi nije ispravna. Vrati se na meni.");
    }
    itemTexts.push(`${quantity}× ${item.name}`);
    foodTotal += Number(quantity) * item.price;
  }
  if (itemTexts.length === 0) return orderError("Korpa je prazna.");

  // Token smo potpisali mi, pa posle provere potpisa znamo kog je oblika.
  const offer = readOrderValue(input.deliveryToken, "partner") as DeliveryOffer | null;
  if (!offer || offer.expiresAt <= Date.now()) return { status: "expired" as const };

  const total = foodTotal + offer.price;
  const addressDetails = input.addressDetails.trim();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("create_web_order", {
    p_quote_id: offer.id,
    p_title: itemTexts.join(", "),
    p_shop: `${partner.name}, ${partner.address.street}, ${partner.address.city}`,
    p_address: addressDetails ? `${offer.address}; ${addressDetails}` : offer.address,
    p_phone: input.phone.trim(),
    p_delivery_price: offer.price,
    p_distance_m: offer.distanceM,
    p_place_id: offer.placeId,
    p_note: `NAPLATI UKUPNO: ${total} din (hrana ${foodTotal} din + dostava ${offer.price} din)`,
  });
  const created = readCreatedOrder(data);
  if (error || !created) {
    console.error("create_web_order failed", error?.code ?? "invalid response");
    return orderError("Porudžbina nije upisana. Pokušaj ponovo ili nas pozovi.");
  }

  // Ponovljena ista ponuda vraća isti broj, bez druge poruke kuriru i vlasniku.
  if (created.created) await notifyNewOrder(created.ticket);

  return { status: "ok" as const, ticket: created.ticket, deliveryPrice: offer.price, total };
}

function orderError(message: string) {
  return { status: "error" as const, message };
}

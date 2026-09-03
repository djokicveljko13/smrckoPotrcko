"use server";

import { computeDistanceMeters } from "@/lib/google/routes";
import { deliveryPriceFromMeters } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOfferForPublicNumber } from "@/lib/telegram";

export type CreateGuestOrderState =
  | { status: "ok"; ticket: string; price: number | null }
  | { status: "error"; message: string }
  | null;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createGuestOrder(
  _prev: CreateGuestOrderState,
  formData: FormData,
): Promise<CreateGuestOrderState> {
  const title = readString(formData, "title");
  const shop = readString(formData, "shop");
  const address = readString(formData, "address");
  const phone = readString(formData, "phone");
  const placeId = readString(formData, "place_id");

  if (!title || !shop || !address || !phone) {
    return { status: "error", message: "Popuni sva polja." };
  }



  if (phone.length < 6) {
    return { status: "error", message: "Telefon izgleda prekratak." };
  }


  let distanceM: number | null = null;
  let price: number | null = null;

  if (placeId) {
    distanceM = await computeDistanceMeters(placeId);

    if (distanceM !== null) {
      price = deliveryPriceFromMeters(distanceM);
    }
  }
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("create_web_order", {
    p_title: title,
    p_shop: shop,
    p_address: address,
    p_phone: phone,
    p_delivery_price: price,
    p_distance_m: distanceM,
    p_place_id: placeId,
  });

  if (error || typeof data !== "string" || data.length === 0) {
    console.error("create_web_order failed", error);
    return {
      status: "error",
      message:
        "Porudžbina nije upisana. Ako si baš sada dodao SQL funkciju, osveži stranicu i pokušaj opet.",
    };
  }

  await sendOfferForPublicNumber(data);

  return { status: "ok", ticket: data, price };
}

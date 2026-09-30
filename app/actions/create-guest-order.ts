"use server";

import { confirmOrderQuote } from "@/lib/order-quote";
import type { CreateGuestOrderState } from "@/lib/order-types";
import { readCreatedOrder } from "@/lib/order-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOfferForPublicNumber } from "@/lib/telegram";

export async function createGuestOrder(token: string): Promise<Exclude<CreateGuestOrderState, null>> {
  try {
    if (typeof token !== "string") {
      return { status: "error", message: "Ponovo proveri cenu pre potvrde.", expired: true };
    }
    return await confirmOrderQuote(token, async ({ id, order, price, distanceM }) => {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.rpc("create_web_order", {
        p_quote_id: id,
        p_title: order.title,
        p_shop: order.shop,
        p_address: order.addressDetails ? `${order.address}; ${order.addressDetails}` : order.address,
        p_phone: order.phone,
        p_delivery_price: price,
        p_distance_m: distanceM,
        p_place_id: order.destinationPlaceId,
        p_note: order.note || null,
      });
      const created = readCreatedOrder(data);
      if (error || !created) {
        console.error("create_web_order failed", error?.code ?? "invalid response");
        return null;
      }
      return created;
    }, sendOfferForPublicNumber);
  } catch {
    console.error("Order confirmation unavailable");
    return { status: "error", message: "Slanje nije potvrđeno. Pozovi nas da proverimo porudžbinu pre ponovnog slanja." };
  }
}

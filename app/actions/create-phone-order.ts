"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { confirmOrderQuote } from "@/lib/order-quote";
import type { CreateGuestOrderState } from "@/lib/order-types";
import { readCreatedOrder } from "@/lib/order-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOfferForPublicNumber } from "@/lib/telegram";

/**
 * Isti potpisani tok kao javna porudžbina, ali izvor je telefon.
 * requireOwner je ulaz: gost ne sme da zove ovu akciju.
 */
export async function createPhoneOrder(
  token: string,
): Promise<Exclude<CreateGuestOrderState, null>> {
  await requireOwner();

  try {
    if (typeof token !== "string") {
      return { status: "error", message: "Ponovo proveri cenu pre potvrde.", expired: true };
    }
    const result = await confirmOrderQuote(token, async ({ id, order, price, distanceM }) => {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin.rpc("create_phone_order", {
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
        console.error("create_phone_order failed", error?.code ?? "invalid response");
        return null;
      }
      return created;
    }, sendOfferForPublicNumber);
    if (result.status === "ok") revalidatePath("/admin");
    return result;
  } catch {
    console.error("Phone order confirmation unavailable");
    return { status: "error", message: "Porudžbina nije upisana. Pokušaj ponovo." };
  }
}

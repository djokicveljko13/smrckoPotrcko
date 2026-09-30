"use server";

import { readCreatedOrder } from "@/lib/order-validation";
import { buildShoppingTitle } from "@/lib/shopping";
import {
  confirmShoppingQuote,
  type CreateShoppingOrderState,
} from "@/lib/shopping-quote";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOfferForPublicNumber } from "@/lib/telegram";

export async function createShoppingOrder(
  token: string,
): Promise<Exclude<CreateShoppingOrderState, null>> {
  try {
    if (typeof token !== "string") {
      return {
        status: "error",
        message: "Ponovo pošalji listu pre potvrde.",
        expired: true,
      };
    }

    return await confirmShoppingQuote(
      token,
      async (quote) => {
        const admin = createSupabaseAdminClient();
        const address = quote.addressDetails
          ? `${quote.address}; ${quote.addressDetails}`
          : quote.address;
        const { data, error } = await admin.rpc("create_shopping_order", {
          p_quote_id: quote.id,
          p_title: buildShoppingTitle(quote.items),
          p_shop: quote.storeLabel,
          p_address: address,
          p_phone: quote.phone,
          p_delivery_price: quote.price,
          p_place_id: quote.destinationPlaceId,
          p_note: quote.note || null,
          p_items: quote.items,
        });
        const created = readCreatedOrder(data);
        if (error || !created) {
          console.error("create_shopping_order failed", error?.code ?? "invalid response");
          return null;
        }
        return created;
      },
      sendOfferForPublicNumber,
    );
  } catch {
    console.error("Shopping order confirmation unavailable");
    return {
      status: "error",
      message:
        "Slanje nije potvrđeno. Pozovi nas da proverimo porudžbinu pre ponovnog slanja.",
    };
  }
}

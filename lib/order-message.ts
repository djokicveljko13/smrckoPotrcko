import { buildCourierMessage } from "@/lib/courier-message";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/** Kolone koje traži poruka o porudžbini. Isti spisak za Telegram i mejl. */
export const ORDER_MESSAGE_COLUMNS =
  "id, public_number, title, shop, address, phone, delivery_price, distance_m, order_type, shopping_note";

/** Postgres numeric/integer ume da stigne kao broj ili kao string. */
function asNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Red porudžbine → tekst koji dobija kurir (Telegram) i vlasnik (mejl).
 * Kupovini dočita stavke liste. null = red fali ili nema obavezna polja.
 */
export async function orderMessageText(
  admin: AdminClient,
  order: Record<string, unknown> | null,
): Promise<string | null> {
  if (
    !order ||
    typeof order.public_number !== "string" ||
    typeof order.title !== "string" ||
    typeof order.shop !== "string" ||
    typeof order.address !== "string" ||
    typeof order.phone !== "string"
  ) {
    return null;
  }

  let items: { text: string }[] | null = null;
  if (order.order_type === "kupovina" && typeof order.id === "string") {
    const { data: rows, error: itemsError } = await admin
      .from("shopping_items")
      .select("text, sort_order")
      .eq("order_id", order.id)
      .order("sort_order", { ascending: true });
    if (itemsError) {
      console.error("Shopping items lookup failed", itemsError);
    } else {
      items = (rows ?? [])
        .filter((row): row is { text: string; sort_order: number } => typeof row.text === "string")
        .map((row) => ({ text: row.text }));
    }
  }

  // Cena i razdaljina smeju da budu null — Google je mogao da zakaže.
  // Zato NISU deo provere iznad; poruka sama zna šta da napiše kad fale.
  return buildCourierMessage({
    public_number: order.public_number,
    title: order.title,
    shop: order.shop,
    address: order.address,
    phone: order.phone,
    delivery_price: asNumberOrNull(order.delivery_price),
    distance_m: asNumberOrNull(order.distance_m),
    order_type: order.order_type === "kupovina" ? "kupovina" : "dostava",
    shopping_note:
      typeof order.shopping_note === "string" ? order.shopping_note : null,
    items,
  });
}

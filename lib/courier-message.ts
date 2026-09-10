import { distanceLabel } from "@/lib/pricing";
import type { OrderType, ShoppingItem } from "@/lib/types";

/**
 * Tekst porudžbine koji kurir dobije preko Telegrama.
 *
 * Cena i razdaljina mogu da budu null — Google sme da zakaže, porudžbina
 * svejedno prolazi. Tada kurir dobije uputstvo umesto iznosa.
 *
 * Fajl se ranije zvao lib/whatsapp.ts; WhatsApp je izbačen, poruka je ostala
 * jer nije vezana za kanal kojim se šalje.
 */
export type MessageOrder = {
  public_number: string;
  title: string;
  shop: string;
  address: string;
  phone: string;
  delivery_price: number | null;
  distance_m: number | null;
  order_type?: OrderType;
  shopping_note?: string | null;
  items?: ShoppingItem[] | string[] | null;
};

function itemText(entry: ShoppingItem | string): string {
  return typeof entry === "string" ? entry : entry.text;
}

export function buildCourierMessage(order: MessageOrder): string {
  const isShopping = order.order_type === "kupovina";
  const lines = [
    `Porudžbina ${order.public_number}`,
    "",
  ];

  if (isShopping) {
    lines.push("Vrsta: KUPOVINA", `Market: ${order.shop}`, "");
    const items = order.items ?? [];
    if (items.length > 0) {
      lines.push("Lista:");
      for (const entry of items) {
        lines.push(`• ${itemText(entry)}`);
      }
      lines.push("");
    } else {
      lines.push(`Šta: ${order.title}`, "");
    }
    if (order.shopping_note) {
      lines.push(`Napomena: ${order.shopping_note}`, "");
    }
    lines.push(`Adresa: ${order.address}`, `Telefon kupca: ${order.phone}`);
  } else {
    lines.push(
      `Šta: ${order.title}`,
      `Odakle: ${order.shop}`,
      `Adresa: ${order.address}`,
      `Telefon kupca: ${order.phone}`,
    );
    if (order.distance_m !== null && order.distance_m !== undefined) {
      lines.push(`Razdaljina: ${distanceLabel(order.distance_m)}`);
    }
  }

  lines.push(
    order.delivery_price !== null
      ? `Naplati dostavu: ${order.delivery_price} din`
      : "Dostava: dogovor telefonom",
  );

  lines.push("", "Plaćanje keš.");

  return lines.join("\n");
}

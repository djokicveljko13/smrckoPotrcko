import { distanceLabel } from "@/lib/pricing";

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
};

export function buildCourierMessage(order: MessageOrder): string {
  const lines = [
    `Porudžbina ${order.public_number}`,
    "",
    `Šta: ${order.title}`,
    `Odakle: ${order.shop}`,
    `Adresa: ${order.address}`,
    `Telefon kupca: ${order.phone}`,
  ];

  if (order.distance_m !== null) {
    lines.push(`Razdaljina: ${distanceLabel(order.distance_m)}`);
  }

  lines.push(
    order.delivery_price !== null
      ? `Naplati dostavu: ${order.delivery_price} din`
      : "Dostava: dogovor telefonom",
  );

  lines.push("", "Plaćanje keš.");

  return lines.join("\n");
}

import { deliveryPriceFromMeters } from "@/lib/pricing";
import { readPlace, readString } from "@/lib/order-validation";

const CHOOSE_ADDRESS = "Izaberi adresu iz ponuđene liste.";
const UNAVAILABLE =
  "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi.";

export type PriceEstimateField = "shop" | "address";

export type PriceEstimateResult =
  | {
      status: "ok";
      price: number;
      distanceM: number;
      shop: string;
      address: string;
    }
  | {
      status: "error";
      message: string;
      fields?: Partial<Record<PriceEstimateField, string>>;
    };

/**
 * Ista cena kao porudžbina, bez upisa.
 *
 * Zašto postoji odvojeno od `prepareOrderQuote`: tamo su obavezni naziv i
 * telefon jer sledi potvrda. Ovde kupac samo pita „koliko je”. Google i
 * formula su isti — Routes meri firma → odredište, pa `deliveryPriceFromMeters`.
 */
export async function estimateDeliveryPrice(
  formData: FormData,
  distance: (placeId: string) => Promise<number | null>,
): Promise<PriceEstimateResult> {
  const shop = readPlace(readString(formData, "shop_selection"), readString(formData, "shop"), 300);
  const address = readPlace(
    readString(formData, "address_selection"),
    readString(formData, "address"),
    400,
  );
  const fields: Partial<Record<PriceEstimateField, string>> = {};
  if (!shop) fields.shop = CHOOSE_ADDRESS;
  if (!address) fields.address = CHOOSE_ADDRESS;
  if (Object.keys(fields).length || !shop || !address) {
    return { status: "error", message: "Proveri označena polja.", fields };
  }

  const distanceM = await distance(address.placeId);
  if (distanceM === null || !Number.isSafeInteger(distanceM) || distanceM < 0 || distanceM > 2_147_483_647) {
    return { status: "error", message: UNAVAILABLE };
  }

  return {
    status: "ok",
    price: deliveryPriceFromMeters(distanceM),
    distanceM,
    shop: shop.text,
    address: address.text,
  };
}

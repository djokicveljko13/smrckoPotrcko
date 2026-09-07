/** Tipovi koje dele forma i server; ovde nema ključeva ni serverskog koda. */
export type AddressSuggestion = { placeId: string; text: string; proof: string };

export type OrderDetails = {
  title: string;
  shop: string;
  address: string;
  addressDetails: string;
  phone: string;
  destinationPlaceId: string;
};

export type OrderQuote = {
  order: OrderDetails;
  distanceM: number;
  price: number;
  expiresAt: number;
};

export type OrderField = "title" | "shop" | "address" | "address_details" | "phone";

export type PrepareOrderResult =
  | { status: "ok"; quote: OrderQuote; token: string }
  | { status: "error"; message: string; fields?: Partial<Record<OrderField, string>> };

export type CreateGuestOrderState =
  | { status: "ok"; ticket: string; price: number }
  | { status: "error"; message: string; expired?: boolean }
  | null;

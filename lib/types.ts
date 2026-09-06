export type OrderZone = "grad" | "van_grada";
export type OrderSource = "sajt" | "telefon";
export type OrderStatus =
  | "nova"
  | "poslata_kuriru"
  | "krenuo"
  | "isporuceno";

export type Courier = {
  id: string;
  name: string;
  phone: string;
  on_shift: boolean;
};

/**
 * Jedan izbor u padajućem meniju „Pošalji kuriru" na tabli.
 * `busy` i `telegram_linked` računa stranica — komponenta samo prikazuje.
 */
export type AssignCourierOption = {
  id: string;
  name: string;
  on_shift: boolean;
  telegram_linked: boolean;
  busy: boolean;
};

/** What the courier page is allowed to see about one ride. */
export type CourierJob = {
  id: string;
  public_number: string;
  title: string;
  shop: string;
  address: string;
  phone: string;
  delivery_price: number | null;
  distance_m: number | null;
  status: OrderStatus;
  offered_at: string | null;
};

export type CourierDashboardData = {
  onShift: boolean;
  telegramLinked: boolean;
  offer: CourierJob | null;
  active: CourierJob | null;
  today: CourierJob[];
};

export type BoardOrder = {
  id: string;
  public_number: string;
  title: string;
  shop: string;
  address: string;
  phone: string;
  delivery_price: number | null;
  distance_m: number | null;
  source: OrderSource;
  status: OrderStatus;
  courier_id: string | null;
  assigned_at: string | null;
  created_at: string;
  courier: { name: string; phone: string } | null;
};

export type AdminCourier = {
  id: string;
  name: string;
  phone: string;
  on_shift: boolean;
  is_active: boolean;
  access_token: string;
  telegram_linked: boolean;
};

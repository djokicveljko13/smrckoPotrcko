"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Vlasnik ručno upiše cenu dostave kad je Google zakazao (delivery_price NULL).
 * Pravilo "nema izmene već izračunate cene" je u bazi: owner_set_delivery_price
 * radi UPDATE samo `where delivery_price is null`.
 */
export type SetDeliveryPriceState = { error: string } | { ok: true } | null;

export async function setDeliveryPrice(
  _prev: SetDeliveryPriceState,
  formData: FormData,
): Promise<SetDeliveryPriceState> {
  await requireOwner();

  const orderId = String(formData.get("order_id") ?? "");
  const rawPrice = String(formData.get("price") ?? "").trim();
  const price = Number(rawPrice);

  if (!orderId || !rawPrice || !Number.isFinite(price) || price <= 0) {
    return { error: "Unesi cenu (broj veći od nule)." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("owner_set_delivery_price", {
    p_order_id: orderId,
    p_price: price,
  });

  if (error) {
    console.error("owner_set_delivery_price failed", error);
    return { error: "Cena nije upisana. Pokušaj opet." };
  }

  // RPC vrati { ok: false, error: "not_editable" } kad cena već postoji.
  if (
    data &&
    typeof data === "object" &&
    "ok" in data &&
    (data as { ok?: unknown }).ok === false
  ) {
    return { error: "Ova porudžbina već ima cenu." };
  }

  revalidatePath("/admin");
  return { ok: true };
}

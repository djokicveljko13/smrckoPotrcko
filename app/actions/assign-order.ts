"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendOffer } from "@/lib/telegram";

/*
 * Vlasnik rucno salje porudzbinu izabranom kuriru: kad su svi zauzeti pa ona
 * visi kao 'nova', ili kad kurir cuti na ponudu. Dalje je tok isti kao kod
 * auto-dodele — kurir dobija Telegram i sme da odbije.
 */
export type AssignOrderState = { error: string } | { ok: true } | null;

const ERRORS: Record<string, string> = {
  unknown_order: "Porudžbina nije pronađena. Osveži stranicu.",
  not_offerable: "Kurir je već krenuo po nju. Ne može da se prosledi.",
  unknown_courier: "Kurir nije pronađen. Osveži stranicu.",
  inactive: "Taj kurir je ugašen. Upali ga na strani Kuriri.",
  busy: "Taj kurir već ima živu vožnju.",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function assignOrder(
  orderId: string,
  _prev: AssignOrderState,
  formData: FormData,
): Promise<AssignOrderState> {
  await requireOwner();

  const courierId = String(formData.get("courier_id") ?? "");

  // Server akcija je javni endpoint — id-jevi se proveravaju ovde, ne samo u UI.
  if (!UUID_RE.test(orderId) || !UUID_RE.test(courierId)) {
    return { error: "Izaberi kurira." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("owner_offer_order_to_courier", {
    p_order_id: orderId,
    p_courier_id: courierId,
  });

  if (error) {
    console.error("owner_offer_order_to_courier failed", error);
    return { error: "Nije poslato. Pokušaj opet." };
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    courier_id?: string;
  } | null;

  if (!result || result.ok !== true) {
    const code = result?.error ?? "";
    return { error: ERRORS[code] ?? "Nije poslato. Pokušaj opet." };
  }

  // Prvo baza, pa Telegram. sendOffer svoje greske samo loguje i nikad ih ne
  // baca navise — ako Telegram zakaze, dodela je vec upisana, pa vlasnik na
  // tabli vidi kome je poslata i moze da ga zovne.
  await sendOffer(result.courier_id ?? null);

  revalidatePath("/admin");
  return { ok: true };
}

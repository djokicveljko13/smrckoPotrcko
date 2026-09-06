"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Vlasnik vodi kurire sa /admin/kuriri. Sve ide kroz owner_* RPC-ove, ne kroz
 * direktan insert/update iz browsera — PIN sme da se heširа samo u bazi, a
 * gašenje kurira je više izmena koje moraju da prođu zajedno.
 * Pravila su u docs/featureAdmin.md, Faza 2.
 */
export type CourierFormState = { error: string } | { ok: true } | null;

/** Kodovi grešaka koje vraćaju owner_* funkcije, prevedeni za vlasnika. */
const ERRORS: Record<string, string> = {
  missing_fields: "Upiši i ime i telefon.",
  bad_pin: "PIN mora imati 4 do 8 cifara.",
  unknown_courier: "Kurir nije pronađen. Osveži stranicu.",
  on_ride: "Kurir je na vožnji. Sačekaj da isporuči, pa ga ugasi.",
  has_live_order:
    "Kurir ima živu porudžbinu. Reši je (ili ga prvo ugasi), pa briši.",
};

/*
 * Isti postupak za sve četiri akcije: potvrdi vlasnika, pozovi RPC, prevedi
 * kod greške, osveži stranicu. RPC vraća jsonb { ok, error }, ne izuzetak —
 * zato posle uspešnog HTTP poziva i dalje mora da se pogleda `ok`.
 */
async function callOwnerRpc(
  fn: string,
  args: Record<string, unknown>,
): Promise<CourierFormState> {
  await requireOwner();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    console.error(`${fn} failed`, error);
    return { error: "Nije upisano. Pokušaj opet." };
  }

  const result = data as { ok?: boolean; error?: string } | null;

  if (!result || result.ok !== true) {
    const code = result?.error ?? "";
    return { error: ERRORS[code] ?? "Nije upisano. Pokušaj opet." };
  }

  revalidatePath("/admin/kuriri");
  // I tabla pokazuje ime kurira na kartici porudzbine, pa i nju treba osveziti.
  revalidatePath("/admin");
  return { ok: true };
}

export async function createCourier(
  _prev: CourierFormState,
  formData: FormData,
): Promise<CourierFormState> {
  return callOwnerRpc("owner_create_courier", {
    p_name: String(formData.get("name") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
    p_pin: String(formData.get("pin") ?? "").trim(),
  });
}

export async function updateCourier(
  courierId: string,
  _prev: CourierFormState,
  formData: FormData,
): Promise<CourierFormState> {
  return callOwnerRpc("owner_update_courier", {
    p_courier_id: courierId,
    p_name: String(formData.get("name") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
  });
}

export async function setCourierPin(
  courierId: string,
  _prev: CourierFormState,
  formData: FormData,
): Promise<CourierFormState> {
  return callOwnerRpc("owner_set_courier_pin", {
    p_courier_id: courierId,
    p_pin: String(formData.get("pin") ?? "").trim(),
  });
}

/*
 * Nema _prev ni formData: obe vrednosti stizu kroz .bind() jer dugme "Ugasi"
 * nema nijedno polje. Funkcija sa manje parametara je i dalje ispravna akcija —
 * React posalje svoje argumente, JavaScript ih prosto ignorise.
 */
export async function setCourierActive(
  courierId: string,
  active: boolean,
): Promise<CourierFormState> {
  return callOwnerRpc("owner_set_courier_active", {
    p_courier_id: courierId,
    p_active: active,
  });
}

/*
 * Trajno brisanje. Stare porudzbine tog kurira ostaju, ali im courier_id
 * postaje NULL (strani kljuc je `on delete set null`) — ime vozaca se gubi.
 * Zato je "Ugasi" i dalje bolji potez za kurira koji je stvarno vozio.
 */
export async function deleteCourier(
  courierId: string,
): Promise<CourierFormState> {
  return callOwnerRpc("owner_delete_courier", { p_courier_id: courierId });
}

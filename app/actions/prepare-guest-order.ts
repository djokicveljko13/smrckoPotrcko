"use server";

import { computeDistanceMeters } from "@/lib/google/routes";
import { prepareOrderQuote } from "@/lib/order-quote";
import type { PrepareOrderResult } from "@/lib/order-types";

export async function prepareGuestOrder(formData: FormData): Promise<PrepareOrderResult> {
  try {
    return await prepareOrderQuote(formData, computeDistanceMeters);
  } catch {
    console.error("Order preparation unavailable");
    return { status: "error", message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi." };
  }
}

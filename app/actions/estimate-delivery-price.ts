"use server";

import { computeDistanceMeters } from "@/lib/google/routes";
import { estimateDeliveryPrice, type PriceEstimateResult } from "@/lib/price-estimate";

export async function estimateGuestDeliveryPrice(
  formData: FormData,
): Promise<PriceEstimateResult> {
  try {
    return await estimateDeliveryPrice(formData, computeDistanceMeters);
  } catch {
    console.error("Price estimate unavailable");
    return {
      status: "error",
      message: "Cena dostave trenutno nije dostupna. Pokušaj ponovo ili nas pozovi.",
    };
  }
}

"use server";

import {
  prepareShoppingQuote,
  type PrepareShoppingResult,
} from "@/lib/shopping-quote";

export async function prepareShoppingOrder(
  formData: FormData,
): Promise<PrepareShoppingResult> {
  try {
    return await prepareShoppingQuote(formData);
  } catch {
    console.error("Shopping order preparation unavailable");
    return {
      status: "error",
      message: "Porudžbina trenutno nije dostupna. Pokušaj ponovo ili nas pozovi.",
    };
  }
}

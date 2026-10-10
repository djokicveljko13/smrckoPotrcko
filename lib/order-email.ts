import { sendOwnerEmail } from "@/lib/email";
import { ORDER_MESSAGE_COLUMNS, orderMessageText } from "@/lib/order-message";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Vlasniku na mejl isti tekst koji kurir dobija na Telegramu, da vidi
 * porudžbinu bez prijave. Ne zavisi od kurira: stiže i kad porudžbina čeka
 * slobodnog. Greške samo loguje — porudžbina je već upisana.
 */
export async function sendNewOrderEmail(publicNumber: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select(ORDER_MESSAGE_COLUMNS)
      .eq("public_number", publicNumber)
      .maybeSingle();

    if (error) {
      console.error("sendNewOrderEmail lookup failed", error.code);
      return;
    }

    const text = await orderMessageText(admin, order);
    if (!text) {
      console.warn("sendNewOrderEmail: order not found", publicNumber);
      return;
    }

    await sendOwnerEmail(`Nova porudžbina ${publicNumber}`, text);
  } catch {
    console.error("sendNewOrderEmail failed");
  }
}

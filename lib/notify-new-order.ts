import { sendNewOrderEmail } from "@/lib/order-email";
import { sendOfferForPublicNumber } from "@/lib/telegram";

/**
 * Nova porudžbina (sajt, kupovina ili unos sa poziva): Telegram kuriru i
 * mejl vlasniku, paralelno. Neko čeka ovaj poziv, pa ne želimo zbir dva
 * timeout-a. allSettled čeka oba do kraja i kad jedno pukne, da Vercel ne
 * preseče ono drugo.
 */
export async function notifyNewOrder(publicNumber: string): Promise<void> {
  await Promise.allSettled([
    sendOfferForPublicNumber(publicNumber),
    sendNewOrderEmail(publicNumber),
  ]);
}

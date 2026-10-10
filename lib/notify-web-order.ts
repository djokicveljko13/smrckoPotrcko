import { sendNewOrderEmail } from "@/lib/order-email";
import { sendOfferForPublicNumber } from "@/lib/telegram";

/**
 * Nova porudžbina sa sajta: Telegram kuriru i mejl vlasniku, paralelno.
 * Kupac čeka ovaj poziv, pa ne želimo zbir dva timeout-a. allSettled čeka
 * oba do kraja i kad jedno pukne, da Vercel ne preseče ono drugo.
 * Unos sa poziva ne ide ovuda — vlasnik je već na tabli.
 */
export async function notifyWebOrder(publicNumber: string): Promise<void> {
  await Promise.allSettled([
    sendOfferForPublicNumber(publicNumber),
    sendNewOrderEmail(publicNumber),
  ]);
}

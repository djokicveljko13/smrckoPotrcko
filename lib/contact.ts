/**
 * Javni broj vlasnika — kupac zove da naruči (isti ulaz kao forma).
 *
 * 066 u Srbiji je mobilni: vodeća nula otpada, ostaje +381 66…
 * Prikaz i linkovi žive ovde da se broj ne raspe po JSX-u.
 */

export const DISPLAY_PHONE = "066 59 355 35";

/** E.164, bez razmaka. Za tel: i Viber. */
export const E164_PHONE = "+381665935535";

export const TEL_URL = `tel:${E164_PHONE}`;

/**
 * wa.me otvara chat, ne glasovni poziv — WhatsApp nema javni link koji
 * dialuje kao tel:. Broj bez plusa.
 */
export const WHATSAPP_URL = "https://wa.me/381665935535";

/** %2B = +. Viber na desktopu bez aplikacije može da ne uradi ništa. */
export const VIBER_URL = "viber://chat?number=%2B381665935535";

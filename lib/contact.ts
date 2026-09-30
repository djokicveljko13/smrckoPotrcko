/**
 * Javni broj vlasnika — kupac zove da naruči (isti ulaz kao forma).
 *
 * 066 u Srbiji je mobilni: vodeća nula otpada, ostaje +381 66…
 * Prikaz i linkovi žive ovde da se broj ne raspe po JSX-u.
 */

export const DISPLAY_PHONE = "066 59 355 35";

/** Prikaz radnog vremena — isto na kontaktu i u crvenoj traci. */
export const OPENING_TIME = "08:00";
export const CLOSING_TIME = "23:00";
export const WORKING_HOURS_LABEL = `${OPENING_TIME}–${CLOSING_TIME}`;

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

export const FACEBOOK_URL =
  "https://www.facebook.com/p/Potrcko-Smrcko-61555618102564/";

export const INSTAGRAM_URL = "https://www.instagram.com/smrckopotrcko/";

export const BUSINESS_ADDRESS = {
  streetAddress: "Kneza Miloša 24",
  addressLocality: "Jagodina",
  addressCountry: "RS",
};

// Zajednička lokacija; Google profil nosi naziv Autoperionica SMRK.
export const LOCATION_MAP_URL = "https://maps.app.goo.gl/ChcMGeUF6qa1bBF27";
export const LOCATION_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2871.098922908816!2d21.265773175416815!3d43.978003771088474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4756c5f6ea576087%3A0xe368dd43339ab72b!2sAutoperionica%20SMRK!5e0!3m2!1ssr!2srs!4v1790717421666!5m2!1ssr!2srs";

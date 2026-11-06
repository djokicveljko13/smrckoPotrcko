/** Korpa: koliko je komada izabrano za svaku stavku, npr. { strips: 4 }. */
export type Cart = Record<string, number>;

/** Najviše komada jedne stavke. Važi na dugmetu i u proveri na serveru. */
export const MAX_QUANTITY = 30;

/*
 * Korpa se čuva u sessionStorage-u, da preživi prelazak sa menija na stranu
 * porudžbine. Živi samo dok je tab otvoren. Browser može da zabrani pristup
 * tom skladištu, pa kupac tada samo ostaje bez pamćenja, a strana ne puca.
 */
export function saveCart(slug: string, cart: Cart) {
  try {
    sessionStorage.setItem(`korpa-${slug}`, JSON.stringify(cart));
  } catch {}
}

export function readCart(slug: string): Cart {
  try {
    return JSON.parse(sessionStorage.getItem(`korpa-${slug}`) ?? "{}");
  } catch {
    return {};
  }
}

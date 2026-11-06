export type Partner={
  slug: string;          // deo URL-a: /partneri/crispy-chicken-korner
  name: string;          // "Crispy Chicken Korner"
  tagline: string;       // jedna rečenica za karticu: "Krilca, batačići i strips"
  address: {
    street: string;      // "Kneza Miloša 24"
    city: string;        // "Jagodina"
    postalCode: string;  // "35000"
  };
  phone: string;         // telefon restorana, ne Potrčka
  instagram?: string;
  logo?: string;         // putanja u /public
  sauces: string[];      // besplatni umaci, kućice na dnu porudžbine
  menu: MenuItem[];
}

/**
 * Jedna stavka menija. Stranica grupiše stavke po `section` i od tih naslova
 * pravi navigaciju (kao Wolt), redom kojim se odeljci pojavljuju u listi.
 */
export type MenuItem = {
  id: string;            // "strips" — ne menja se, po njemu server nalazi cenu
  name: string;          // "Strips"
  price: number;         // 90 — broj u dinarima, "din" se dopisuje tek na ekranu
  section: string;       // "Napravi sam svoju kombinaciju"
  description?: string;  // "4× strips, 4× batačići, 4× krilca + pomfrit"
  unit?: string;         // "kom" → "90 din/kom"
  image?: string;        // putanja u /public
};

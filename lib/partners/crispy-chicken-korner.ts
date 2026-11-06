import type { Partner } from "@/lib/partners/types";

const COMBOS = "Kombinacije";
const BUILD_YOUR_OWN = "Napravi sam svoju kombinaciju";
const DRINKS = "Piće";
const IMAGES = "/partneri/crispy-chicken-korner";

/** Podaci sa štampanog menija (public/krilca/), potvrdio Veljko 24.10.2026. */
export const crispyChickenKorner: Partner = {
  slug: "crispy-chicken-korner",
  name: "Crispy Chicken Korner",
  tagline: "Hrskava pohovana piletina: krilca, batačići i strips",
  address: {
    street: "Kneza Miloša 24",
    city: "Jagodina",
    postalCode: "35000",
  },
  phone: "063 192 95 55",
  instagram: "https://www.instagram.com/chrispy_chiken_korner/",
  logo: "/partneri/crispy-chicken-korner/logo-rooster.png",
  sauces: ["Kečap", "Ljutenica", "1000 ostrva", "Čili", "Garlic sos"],
  menu: [
    {
      id: "kombinacija-1-osoba",
      name: "Kombinacija za 1 osobu",
      description: "4× strips, 4× batačići, 4× krilca + pomfrit",
      price: 1170,
      section: COMBOS,
      image: `${IMAGES}/kombinacija-1-osoba.webp`,
    },
    {
      id: "kombinacija-2-osobe",
      name: "Kombinacija za 2 osobe",
      description: "10× strips, 10× batačići, 10× krilca + pomfrit",
      price: 2370,
      section: COMBOS,
      image: `${IMAGES}/kombinacija-2-osobe.webp`,
    },
    {
      id: "kombinacija-4-osobe",
      name: "Kombinacija za 4 osobe",
      description: "15× strips, 15× batačići, 15× krilca + pomfrit",
      price: 3470,
      section: COMBOS,
      image: `${IMAGES}/kombinacija-4-osobe.webp`,
    },
    {
      id: "strips",
      name: "Strips",
      price: 90,
      unit: "kom",
      section: BUILD_YOUR_OWN,
      image: `${IMAGES}/strips.webp`,
    },
    {
      id: "batacici",
      name: "Batačići",
      price: 70,
      unit: "kom",
      section: BUILD_YOUR_OWN,
      image: `${IMAGES}/batacici.webp`,
    },
    {
      id: "krilca",
      name: "Krilca",
      price: 70,
      unit: "kom",
      section: BUILD_YOUR_OWN,
      image: `${IMAGES}/krilca.webp`,
    },
    {
      id: "pepsi-033",
      name: "Pepsi, limenka 0,33 l",
      price: 140,
      section: DRINKS,
      image: `${IMAGES}/pepsi-033.webp`,
    },
    {
      id: "niksicko-05",
      name: "Nikšićko pivo 0,5 l",
      price: 160,
      section: DRINKS,
      image: `${IMAGES}/niksicko-05.webp`,
    },
  ],
};

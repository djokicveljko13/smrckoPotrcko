import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { googleMapsUrl } = loadTypeScript("lib/maps-link.ts");

const delivery = {
  id: "order-1", public_number: "P-21", title: "Dve pice", shop: "Pekara Lane, Jagodina",
  address: "Kneza Miloša 24, Jagodina; ulaz 2, sprat 3", phone: "066 123 4567",
  delivery_price: 260, distance_m: 2000, order_type: "dostava", shopping_note: null,
  destination_place_id: "ChIJ-odrediste",
};

/** Lažni Supabase: svaki upit nad tabelom vraća zadati red. */
function fakeAdmin(tables) {
  return {
    from(table) {
      const result = () => ({ data: tables[table] ?? null, error: null });
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => result(),
        then: (resolve) => resolve(result()),
      };
      return chain;
    },
  };
}

/** Pošalje ponudu za zadati red i vrati telo poziva ka Telegramu. */
async function sentOffer(t, order, siteUrl) {
  const keys = ["TELEGRAM_BOT_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"];
  const previous = keys.map((key) => process.env[key]);
  t.after(() => keys.forEach((key, i) => {
    if (previous[i] === undefined) delete process.env[key];
    else process.env[key] = previous[i];
  }));
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  if (siteUrl) process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  else delete process.env.NEXT_PUBLIC_SITE_URL;

  const bodies = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return new Response("{}", { status: 200 });
  });
  const admin = fakeAdmin({
    orders: order,
    couriers: { telegram_chat_id: 42, access_token: "tajni-token" },
    shopping_items: [{ text: "Mleko", sort_order: 0 }],
  });
  const { sendOffer } = loadTypeScript("lib/telegram.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => admin },
  });
  await sendOffer("courier-1");
  assert.equal(bodies.length, 1);
  return bodies[0];
}

test("Google Maps link: place_id ima prednost, tekst je rezerva", () => {
  const url = new URL(googleMapsUrl("Kneza Miloša 24, Jagodina", "ChIJ-abc"));
  assert.equal(url.origin + url.pathname, "https://www.google.com/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), "Kneza Miloša 24, Jagodina");
  assert.equal(url.searchParams.get("query_place_id"), "ChIJ-abc");

  assert.equal(new URL(googleMapsUrl("Maxi, Jagodina", null)).searchParams.has("query_place_id"), false);
  assert.equal(googleMapsUrl("   "), null);
});

test("dostava: dugmad za preuzimanje i dostavu u jednom redu, porudžbina ispod", async (t) => {
  const body = await sentOffer(t, delivery, "https://smrckopotrcko.rs");
  const [maps, page] = body.reply_markup.inline_keyboard;

  assert.deepEqual(maps.map((button) => button.text), ["📍 Preuzimanje", "📍 Dostava"]);
  assert.equal(new URL(maps[0].url).searchParams.get("query"), "Pekara Lane, Jagodina");

  const destination = new URL(maps[1].url).searchParams;
  assert.equal(destination.get("query"), "Kneza Miloša 24, Jagodina");
  assert.equal(destination.get("query_place_id"), "ChIJ-odrediste");

  assert.deepEqual(page, [{ text: "Otvori porudžbinu", url: "https://smrckopotrcko.rs/k/tajni-token" }]);
  // Tekst ostaje isti kao u mejlu: link je samo u dugmetu.
  assert.doesNotMatch(body.text, /google\.com/);
});

test("kupovina: market nije adresa, ostaje samo dugme za dostavu", async (t) => {
  const body = await sentOffer(t, { ...delivery, order_type: "kupovina", shop: "Maxi", destination_place_id: null });
  assert.equal(body.reply_markup.inline_keyboard.length, 1);
  const [only] = body.reply_markup.inline_keyboard[0];
  assert.equal(only.text, "📍 Dostava");
  assert.equal(new URL(only.url).searchParams.has("query_place_id"), false);
});

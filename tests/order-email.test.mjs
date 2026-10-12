import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const delivery = {
  id: "order-1", public_number: "P-21", title: "Dve pice", shop: "Radnja, Jagodina",
  address: "Ulica 24, Jagodina", phone: "066 123 4567", delivery_price: "260",
  distance_m: 2000, order_type: "dostava", shopping_note: "Zvoni dva puta",
};

/** Lažni Supabase: svaki upit nad tabelom vraća zadati red, a filteri se beleže. */
function fakeAdmin(tables) {
  const filters = [];
  return {
    filters,
    from(table) {
      const result = () => ({ data: tables[table] ?? null, error: null });
      const chain = {
        select: () => chain,
        eq: (column, value) => { filters.push([table, column, value]); return chain; },
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => result(),
        then: (resolve) => resolve(result()),
      };
      return chain;
    },
  };
}

function loadOrderEmail(admin, sent) {
  return loadTypeScript("lib/order-email.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => admin },
    "@/lib/email": { sendOwnerEmail: async (subject, text) => { sent.push({ subject, text }); return true; } },
  });
}

test("mejl vlasniku i Telegram kuriru nose isti tekst porudžbine", async (t) => {
  const keys = ["TELEGRAM_BOT_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"];
  const previous = keys.map((key) => process.env[key]);
  t.after(() => keys.forEach((key, i) => {
    if (previous[i] === undefined) delete process.env[key];
    else process.env[key] = previous[i];
  }));
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  delete process.env.NEXT_PUBLIC_SITE_URL;

  const admin = fakeAdmin({ orders: delivery, couriers: { telegram_chat_id: 42, access_token: "tajni-token" } });
  const telegram = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    telegram.push(JSON.parse(options.body));
    return new Response("{}", { status: 200 });
  });
  const { sendOffer } = loadTypeScript("lib/telegram.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => admin },
  });
  await sendOffer("courier-1");

  const sent = [];
  await loadOrderEmail(admin, sent).sendNewOrderEmail("P-21");

  assert.equal(telegram.length, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Nova porudžbina P-21");
  assert.equal(sent[0].text, telegram[0].text);
  assert.match(sent[0].text, /Naplati dostavu: 260 din/);
  assert.doesNotMatch(sent[0].text, /tajni-token/);
  // Mejl traži porudžbinu po broju, ne po kuriru: stiže i kad niko nije slobodan.
  assert.deepEqual(admin.filters.at(-1), ["orders", "public_number", "P-21"]);
});

test("mejl za kupovinu nosi listu stavki", async () => {
  const sent = [];
  const admin = fakeAdmin({
    orders: { ...delivery, order_type: "kupovina", shop: "Maxi", delivery_price: 500, distance_m: null },
    shopping_items: [{ text: "Mleko 1.5 l", sort_order: 0 }, { text: "Hleb", sort_order: 1 }],
  });
  await loadOrderEmail(admin, sent).sendNewOrderEmail("P-21");
  assert.match(sent[0].text, /Vrsta: KUPOVINA/);
  assert.match(sent[0].text, /• Mleko 1\.5 l\n• Hleb/);
});

test("bez porudžbine ili bez baze mejl ne ide, a greška ne izlazi napolje", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
  const sent = [];
  await loadOrderEmail(fakeAdmin({}), sent).sendNewOrderEmail("P-99");
  const broken = loadTypeScript("lib/order-email.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => { throw new Error("no service role"); } },
    "@/lib/email": { sendOwnerEmail: async () => assert.fail("Nema slanja") },
  });
  await broken.sendNewOrderEmail("P-21");
  assert.equal(sent.length, 0);
});

test("pukao Telegram ne zaustavlja mejl vlasniku", async () => {
  const emails = [];
  const { notifyNewOrder } = loadTypeScript("lib/notify-new-order.ts", {
    "@/lib/telegram": { sendOfferForPublicNumber: async () => { throw new Error("Telegram down"); } },
    "@/lib/order-email": { sendNewOrderEmail: async (ticket) => { emails.push(ticket); } },
  });
  await notifyNewOrder("P-21");
  assert.deepEqual(emails, ["P-21"]);
});

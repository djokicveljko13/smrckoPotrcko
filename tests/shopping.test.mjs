import assert from "node:assert/strict";
import { after, test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const previousSecret = process.env.ORDER_SIGNING_SECRET;
process.env.ORDER_SIGNING_SECRET = "test-only-signing-secret-with-at-least-32-characters";
after(() => {
  if (previousSecret === undefined) delete process.env.ORDER_SIGNING_SECRET;
  else process.env.ORDER_SIGNING_SECRET = previousSecret;
});

const { signOrderValue, readOrderValue } = loadTypeScript("lib/order-signing.ts");
const { findShoppingStore } = loadTypeScript("lib/pricing.ts");
const { normalizeItems, buildShoppingTitle, MAX_SHOPPING_ITEMS } = loadTypeScript("lib/shopping.ts");
const {
  prepareShoppingQuote,
  confirmShoppingQuote,
  SHOPPING_QUOTE_TTL_MS,
} = loadTypeScript("lib/shopping-quote.ts");
const { buildCourierMessage } = loadTypeScript("lib/courier-message.ts");

const destination = { placeId: "google-destination", text: "Ulica 24, Jagodina, Srbija" };

function shoppingForm(overrides = {}) {
  const { items, ...fields } = overrides;
  const data = new FormData();
  for (const [key, value] of Object.entries({
    store: "maxi",
    note: "",
    address: destination.text,
    address_details: "ulaz B",
    phone: "066 123 4567",
    address_selection: signOrderValue("place", destination),
    ...fields,
  })) {
    if (value !== undefined) data.set(key, value);
  }
  for (const item of items ?? ["2x mleko", "hleb"]) {
    data.append("items", item);
  }
  return data;
}

test("SHOPPING_STORES: Maxi/Roda/IDEA 500, Lidl 1000, nepoznat null", () => {
  assert.equal(findShoppingStore("maxi")?.price, 500);
  assert.equal(findShoppingStore("roda")?.price, 500);
  assert.equal(findShoppingStore("idea")?.price, 500);
  assert.equal(findShoppingStore("lidl")?.price, 1000);
  assert.equal(findShoppingStore("tempo"), null);
  assert.equal(findShoppingStore(""), null);
});

test("normalizeItems odbija prazno, preko 30 i predugačke stavke", () => {
  assert.deepEqual(normalizeItems(["  mleko  ", "", "hleb"]), ["mleko", "hleb"]);
  assert.equal(normalizeItems([]), null);
  assert.equal(normalizeItems(["x".repeat(121)]), null);
  assert.equal(normalizeItems(Array.from({ length: MAX_SHOPPING_ITEMS + 1 }, () => "a")), null);
  assert.equal(normalizeItems(Array.from({ length: MAX_SHOPPING_ITEMS }, () => "a"))?.length, 30);
});

test("buildShoppingTitle sažima listu", () => {
  const title = buildShoppingTitle(["2x mleko", "hleb"]);
  assert.match(title, /^Kupovina \(2\):/);
  assert.match(title, /mleko/);
});

test("prepareShoppingQuote izvodi cenu iz store id-ja, ne iz forme", async () => {
  const ok = await prepareShoppingQuote(shoppingForm({ store: "lidl" }), () => 1000);
  assert.equal(ok.status, "ok");
  assert.equal(ok.quote.price, 1000);
  assert.equal(ok.quote.store, "lidl");
  assert.equal(ok.quote.expiresAt, 1000 + SHOPPING_QUOTE_TTL_MS);
  assert.equal(readOrderValue(ok.token, "shopping").price, 1000);
  assert.equal(readOrderValue(ok.token, "quote"), null);
});

test("nepoznat store i prazna lista ne prolaze", async () => {
  const badStore = await prepareShoppingQuote(shoppingForm({ store: "tempo" }));
  assert.equal(badStore.status, "error");
  assert.equal(badStore.fields.store, "Izaberi market u kom kupujemo.");

  const data = shoppingForm();
  data.delete("items");
  const empty = await prepareShoppingQuote(data);
  assert.equal(empty.status, "error");
  assert.equal(empty.fields.items, "Upiši bar jednu stavku na listu (najviše 30).");
});

test("confirmShoppingQuote upisuje i ne zove Google", async () => {
  const prepared = await prepareShoppingQuote(shoppingForm({ store: "idea" }), () => 5000);
  assert.equal(prepared.status, "ok");
  const events = [];
  const confirmed = await confirmShoppingQuote(
    prepared.token,
    async (quote) => {
      assert.equal(quote.price, 500);
      assert.equal(quote.storeLabel, "IDEA");
      assert.equal(quote.id, prepared.quote.id);
      events.push("insert");
      return { ticket: "P-42", created: true };
    },
    async (ticket) => {
      assert.equal(ticket, "P-42");
      events.push("notify");
    },
    () => 5000,
  );
  assert.deepEqual(events, ["insert", "notify"]);
  assert.deepEqual(confirmed, { status: "ok", ticket: "P-42", price: 500 });
});

test("ponovljena kupovina vraća isti broj bez novog obaveštenja", async () => {
  const prepared = await prepareShoppingQuote(shoppingForm({ store: "idea" }), () => 5000);
  const confirmed = await confirmShoppingQuote(
    prepared.token,
    async () => ({ ticket: "P-42", created: false }),
    async () => assert.fail("Ponovljena ponuda ne sme ponovo da zove kurira"),
    () => 5000,
  );
  assert.deepEqual(confirmed, { status: "ok", ticket: "P-42", price: 500 });
});

test("Telegram poruka za kupovinu nosi listu i napomenu", () => {
  const text = buildCourierMessage({
    public_number: "P-42",
    title: "Kupovina (2): mleko, hleb",
    shop: "Lidl",
    address: "Ulica 1",
    phone: "066",
    delivery_price: 1000,
    distance_m: null,
    order_type: "kupovina",
    shopping_note: "bez laktoze",
    items: [{ text: "mleko" }, { text: "hleb" }],
  });
  assert.match(text, /KUPOVINA/);
  assert.match(text, /Market: Lidl/);
  assert.match(text, /• mleko/);
  assert.match(text, /Napomena: bez laktoze/);
  assert.match(text, /Naplati dostavu: 1000 din/);
  assert.doesNotMatch(text, /Razdaljina/);
});

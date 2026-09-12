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
const { prepareOrderQuote, confirmOrderQuote, QUOTE_TTL_MS } = loadTypeScript("lib/order-quote.ts");
const pickup = { placeId: "google-pickup", text: "Radnja, Jagodina, Srbija" };
const destination = { placeId: "google-destination", text: "Ulica 24, Jagodina, Srbija" };

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Dve pice", shop: pickup.text, address: destination.text,
    address_details: "ulaz B, 2. sprat, stan 8", phone: "066 123 4567",
    shop_selection: signOrderValue("place", pickup),
    address_selection: signOrderValue("place", destination),
  })) data.set(key, value);
  return data;
}

test("potpis vezuje sadržaj i namenu i odbija promene", () => {
  const token = signOrderValue("place", pickup);
  assert.deepEqual(readOrderValue(token, "place"), pickup);
  assert.equal(readOrderValue(token, "quote"), null);
  const [body, signature] = token.split(".");
  const changed = Buffer.from(JSON.stringify({ version: 1, purpose: "place", value: destination })).toString("base64url");
  assert.equal(readOrderValue(`${changed}.${signature}`, "place"), null);
  for (const invalid of ["", "abc", `${body}.abc`, `${token}.extra`, "x".repeat(20_001)]) {
    assert.equal(readOrderValue(invalid, "place"), null);
  }
});

test("obe adrese zahtevaju potpisan izbor, a naknadni ručni tekst ne prolazi", async () => {
  for (const field of ["shop", "address"]) {
    for (const mode of ["missing", "edited", "forged"]) {
      const data = form();
      if (mode === "missing") data.delete(`${field}_selection`);
      if (mode === "edited") data.set(field, "Ručni unos");
      if (mode === "forged") data.set(`${field}_selection`, "fake-google-id");
      let calls = 0;
      const result = await prepareOrderQuote(data, async () => { calls++; return 1000; });
      assert.equal(result.status, "error");
      assert.equal(result.fields[field], "Izaberi adresu iz ponuđene liste.");
      assert.equal(calls, 0);
    }
  }
});

test("server proverava granice dužina i telefon", async () => {
  for (const [key, value] of [["title", "x".repeat(501)], ["title", "  "], ["phone", "abcdef"], ["phone", "12345"], ["phone", "1".repeat(41)], ["address_details", "x".repeat(151)]]) {
    const data = form(); data.set(key, value);
    const result = await prepareOrderQuote(data, async () => { assert.fail("Google ne sme biti pozvan"); });
    assert.equal(result.status, "error");
    assert(result.fields[key]);
  }
});

test("bez rute ili ispravne kilometraže nema ponude", async () => {
  for (const distance of [null, NaN, Infinity, -1, 1.5, 2_147_483_648]) {
    assert.equal((await prepareOrderQuote(form(), async () => distance)).status, "error");
  }
  assert.equal((await prepareOrderQuote(form(), async () => 0)).status, "ok");
});

test("obračun zove Routes samo za odredište, traje 15 minuta i potvrđuje istu cenu", async () => {
  let calls = 0;
  const result = await prepareOrderQuote(form(), async (id) => { calls++; assert.equal(id, destination.placeId); return 2000; }, () => 1000);
  assert.equal(result.status, "ok");
  assert.equal(result.quote.price, 260);
  assert.equal(result.quote.expiresAt, 1000 + QUOTE_TTL_MS);
  const events = [];
  const confirmed = await confirmOrderQuote(result.token, async (quote) => {
    assert.deepEqual(quote, result.quote); events.push("insert"); return "P-17";
  }, async (ticket) => { assert.equal(ticket, "P-17"); events.push("notify"); }, () => 2000);
  assert.deepEqual(confirmed, { status: "ok", ticket: "P-17", price: 260 });
  assert.deepEqual(events, ["insert", "notify"]);
  assert.equal(calls, 1);
});

test("istekla, promenjena ili pogrešne namene ponuda ne stiže do baze", async () => {
  const result = await prepareOrderQuote(form(), async () => 2000, () => 1000);
  const [payload, signature] = result.token.split(".");
  const envelope = JSON.parse(Buffer.from(payload, "base64url").toString());
  envelope.value.price = 1;
  const forged = `${Buffer.from(JSON.stringify(envelope)).toString("base64url")}.${signature}`;
  for (const [token, now] of [[result.token, result.quote.expiresAt], [forged, 2000], [signOrderValue("place", pickup), 2000]]) {
    const response = await confirmOrderQuote(token, async () => assert.fail("Nema upisa"), async () => assert.fail("Nema obaveštenja"), () => now);
    assert.equal(response.status, "error");
    assert.equal(response.expired, true);
  }
});

test("greška upisa ne šalje obaveštenje; greška obaveštenja ne poništava uspešan upis", async () => {
  const result = await prepareOrderQuote(form(), async () => 2000);
  assert.equal((await confirmOrderQuote(result.token, async () => null, async () => assert.fail("Nema obaveštenja"))).status, "error");
  const response = await confirmOrderQuote(result.token, async () => "P-18", async () => { throw new Error("Telegram down"); });
  assert.deepEqual(response, { status: "ok", ticket: "P-18", price: 260 });
});

test("stvarne akcije: priprema ne upisuje, potvrda mapira detalje stana u postojeću kolonu", async () => {
  const inserts = [], notifications = [];
  let googleCalls = 0;
  const mocks = {
    "@/lib/google/routes": { computeDistanceMeters: async () => { googleCalls++; return 2000; } },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => ({ rpc: async (name, args) => {
      assert.equal(name, "create_web_order"); inserts.push(args); return { data: "P-19", error: null };
    } }) },
    "@/lib/telegram": { sendOfferForPublicNumber: async (ticket) => notifications.push(ticket) },
  };
  const { prepareGuestOrder } = loadTypeScript("app/actions/prepare-guest-order.ts", mocks);
  const { createGuestOrder } = loadTypeScript("app/actions/create-guest-order.ts", mocks);
  const prepared = await prepareGuestOrder(form());
  assert.equal(inserts.length, 0); assert.equal(notifications.length, 0);
  const confirmed = await createGuestOrder(prepared.token);
  assert.equal(confirmed.price, prepared.quote.price);
  assert.deepEqual(inserts, [{ p_title: "Dve pice", p_shop: pickup.text,
    p_address: `${destination.text}; ulaz B, 2. sprat, stan 8`, p_phone: "066 123 4567",
    p_delivery_price: 260, p_distance_m: 2000, p_place_id: destination.placeId }]);
  assert.deepEqual(notifications, ["P-19"]); assert.equal(googleCalls, 1);
  assert.equal((await createGuestOrder(new FormData())).status, "error");
  assert.equal(inserts.length, 1);
});

test("API potpisuje stvarne predloge, razlikuje prazan rezultat i grešku", async () => {
  let result = [pickup];
  const { POST } = loadTypeScript("app/api/adrese/route.ts", {
    "@/lib/google/places": { suggestAddresses: async () => result },
  });
  const request = () => new Request("http://localhost/api/adrese", { method: "POST", body: JSON.stringify({ input: "Jagodina" }) });
  const response = await POST(request());
  const data = await response.json();
  assert.equal(data.status, "ok");
  assert.deepEqual(readOrderValue(data.suggestions[0].proof, "place"), pickup);
  result = []; assert.deepEqual((await (await POST(request())).json()).suggestions, []);
  result = null; assert.equal((await POST(request())).status, 503);
});

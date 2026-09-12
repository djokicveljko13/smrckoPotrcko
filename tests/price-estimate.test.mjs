import assert from "node:assert/strict";
import { after, test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const previousSecret = process.env.ORDER_SIGNING_SECRET;
process.env.ORDER_SIGNING_SECRET = "test-only-signing-secret-with-at-least-32-characters";
after(() => {
  if (previousSecret === undefined) delete process.env.ORDER_SIGNING_SECRET;
  else process.env.ORDER_SIGNING_SECRET = previousSecret;
});

const { signOrderValue } = loadTypeScript("lib/order-signing.ts");
const { estimateDeliveryPrice } = loadTypeScript("lib/price-estimate.ts");
const pickup = { placeId: "google-pickup", text: "Radnja, Jagodina, Srbija" };
const destination = { placeId: "google-destination", text: "Ulica 24, Jagodina, Srbija" };

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    shop: pickup.text,
    address: destination.text,
    shop_selection: signOrderValue("place", pickup),
    address_selection: signOrderValue("place", destination),
  })) data.set(key, value);
  return data;
}

test("kalkulator traži oba potpisana predloga i ne zove Google dok fale", async () => {
  for (const field of ["shop", "address"]) {
    const data = form();
    data.delete(`${field}_selection`);
    let calls = 0;
    const result = await estimateDeliveryPrice(data, async () => {
      calls += 1;
      return 1000;
    });
    assert.equal(result.status, "error");
    assert.equal(result.fields[field], "Izaberi adresu iz ponuđene liste.");
    assert.equal(calls, 0);
  }
});

test("kalkulator meri samo odredište i daje istu cenu kao porudžbina", async () => {
  let calls = 0;
  const result = await estimateDeliveryPrice(form(), async (id) => {
    calls += 1;
    assert.equal(id, destination.placeId);
    return 2000;
  });
  assert.equal(result.status, "ok");
  assert.equal(result.price, 260);
  assert.equal(result.distanceM, 2000);
  assert.equal(result.shop, pickup.text);
  assert.equal(result.address, destination.text);
  assert.equal(calls, 1);
});

test("bez rute nema cene", async () => {
  assert.equal((await estimateDeliveryPrice(form(), async () => null)).status, "error");
});

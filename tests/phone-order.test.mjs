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

test("telefonski unos zove create_phone_order i ostaje bez javne hvala stranice", async () => {
  const inserts = [];
  const notifications = [];
  let ownerChecks = 0;
  const mocks = {
    "@/lib/auth": { requireOwner: async () => { ownerChecks++; return { id: "owner" }; } },
    "next/cache": { revalidatePath: () => {} },
    "@/lib/google/routes": { computeDistanceMeters: async () => 2000 },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => ({ rpc: async (name, args) => {
      assert.equal(name, "create_phone_order");
      inserts.push(args);
      return { data: { public_number: "P-40", created: true }, error: null };
    } }) },
    "@/lib/telegram": { sendOfferForPublicNumber: async (ticket) => notifications.push(ticket) },
  };
  const { prepareGuestOrder } = loadTypeScript("app/actions/prepare-guest-order.ts", mocks);
  const { createPhoneOrder } = loadTypeScript("app/actions/create-phone-order.ts", mocks);
  const prepared = await prepareGuestOrder(form());
  assert.equal(inserts.length, 0);
  const confirmed = await createPhoneOrder(prepared.token);
  assert.equal(ownerChecks, 1);
  assert.deepEqual(confirmed, { status: "ok", ticket: "P-40", price: prepared.quote.price });
  assert.equal(inserts[0].p_phone, "066 123 4567");
  assert.equal(inserts[0].p_quote_id, prepared.quote.id);
  assert.deepEqual(notifications, ["P-40"]);
});

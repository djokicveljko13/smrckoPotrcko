import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ company: "Test firma", phone: "0661234567", message: "Dostava", ...overrides })) {
    data.set(key, value);
  }
  return data;
}

test("saradnja: validacija i bot ne salju mejl; uspeh zavisi od slanja", async () => {
  let calls = 0;
  let accepted = true;
  const { submitPartnership } = loadTypeScript("app/actions/partnership.ts", {
    "@/lib/email": { sendPartnershipEmail: async () => { calls++; return accepted; } },
  });
  for (const fields of [{ company: " " }, { company: "x".repeat(201) }, { phone: "123" }, { phone: "1".repeat(41) }, { message: "x".repeat(1001) }]) {
    assert.equal((await submitPartnership(form(fields))).status, "error");
  }
  assert.equal((await submitPartnership(form({ website: "bot" }))).status, "ok");
  assert.equal(calls, 0);
  assert.equal((await submitPartnership(form())).status, "ok");
  accepted = false;
  assert.equal((await submitPartnership(form())).status, "error");
  assert.equal(calls, 2);
});

test("Resend: konfiguracija, fiksni primalac, odbijanje i prekid veze", async (t) => {
  const keys = ["RESEND_API_KEY", "EMAIL_FROM", "PARTNERSHIP_EMAIL_TO"];
  const previous = keys.map((key) => process.env[key]);
  t.after(() => keys.forEach((key, i) => {
    if (previous[i] === undefined) delete process.env[key];
    else process.env[key] = previous[i];
  }));
  t.mock.method(console, "warn", () => {});
  const request = t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["owner@example.com"]);
    assert.equal(body.from, "test@example.com");
    assert.match(body.text, /Test firma/);
    return new Response(JSON.stringify({ id: "test-email-id" }), { status: 200 });
  });
  const { sendPartnershipEmail } = loadTypeScript("lib/email.ts", { "server-only": {} });
  const input = { company: "Test firma", phone: "0661234567", message: "" };
  keys.forEach((key) => delete process.env[key]);
  assert.equal(await sendPartnershipEmail(input), false);
  assert.equal(request.mock.callCount(), 0);
  process.env.RESEND_API_KEY = "fake-test-key";
  process.env.EMAIL_FROM = "test@example.com";
  process.env.PARTNERSHIP_EMAIL_TO = "owner@example.com";
  assert.equal(await sendPartnershipEmail(input), true);
  delete process.env.EMAIL_FROM;
  request.mock.mockImplementation(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.from, "Šmrčko Potrčko <onboarding@resend.dev>");
    assert.deepEqual(body.to, ["owner@example.com"]);
    return new Response(JSON.stringify({ id: "test-default-sender" }), { status: 200 });
  });
  assert.equal(await sendPartnershipEmail(input), true);
  request.mock.mockImplementation(async () => new Response("{}", { status: 403 }));
  assert.equal(await sendPartnershipEmail(input), false);
  request.mock.mockImplementation(async () => new Response("{}", { status: 200 }));
  assert.equal(await sendPartnershipEmail(input), false);
  request.mock.mockImplementation(async () => { throw new Error("timeout"); });
  assert.equal(await sendPartnershipEmail(input), false);
});

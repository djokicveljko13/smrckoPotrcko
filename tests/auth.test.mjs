import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

function credentials(email = "owner@example.com", password = "test-password") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

function loadAuth(error = null) {
  const calls = [];
  const actions = loadTypeScript("app/actions/auth.ts", {
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: {
          signInWithPassword: async (input) => { calls.push(input); return { error }; },
          signOut: async () => {},
        },
      }),
    },
    "next/navigation": { redirect: (path) => { throw new Error(`redirect:${path}`); } },
  });
  return { actions, calls };
}

test("auth: registracija nije izlozena kao server action", () => {
  const { actions } = loadAuth();
  assert.equal(actions.signUp, undefined);
});

test("auth: prazna polja ne pozivaju Supabase", async () => {
  const { actions, calls } = loadAuth();
  assert.ok((await actions.signIn(null, credentials("", ""))).error);
  assert.equal(calls.length, 0);
});

test("auth: nepoznat nalog i nepotvrdjen email daju istu poruku", async () => {
  const invalid = loadAuth({ status: 400, message: "Invalid login credentials" });
  const unconfirmed = loadAuth({ status: 400, message: "Email not confirmed" });
  assert.deepEqual(
    await invalid.actions.signIn(null, credentials()),
    await unconfirmed.actions.signIn(null, credentials()),
  );
});

test("auth: Supabase ogranicenje prikazuje poruku da se saceka", async () => {
  const { actions } = loadAuth({ status: 429, message: "Too many requests" });
  const result = await actions.signIn(null, credentials());
  assert.match(result.error, /pokušaja/);
});

test("auth: uspesna prijava i odjava zadrzavaju preusmerenja", async () => {
  const { actions, calls } = loadAuth();
  await assert.rejects(actions.signIn(null, credentials(" owner@example.com ")), /redirect:\/admin/);
  assert.equal(calls[0].email, "owner@example.com");
  await assert.rejects(actions.signOut(), /redirect:\/prijava/);
});

test("registracija: direktna poseta vraca notFound", () => {
  const { default: SignupPage } = loadTypeScript("app/registracija/page.tsx", {
    "next/navigation": { notFound: () => { throw new Error("not-found"); } },
  });
  assert.throws(() => SignupPage(), /not-found/);
});

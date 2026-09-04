"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { signupCode } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = { error: string } | null;

/** Isto poređenje konstantnim vremenom kao u app/api/telegram/webhook/route.ts. */
function secretsEqual(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export type SignUpState = { error: string } | { ok: true; needsConfirm: boolean } | null;

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Unesi email i lozinku." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Nalog postoji, ali email nije potvrđen. U Dashboardu: Authentication → Users → Confirm.",
      };
    }
    return { error: "Pogrešan email ili lozinka." };
  }

  redirect("/admin");
}

/*
 * Vlasnik sam pravi svoj nalog — ali samo ako zna tajni kod iz OWNER_SIGNUP_CODE.
 * Bez tog koda ruta je mrtva, jer u ovoj bazi važi "ulogovan = vlasnik":
 * svaki nalog vidi sve adrese i telefone kupaca.
 */
export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const expected = signupCode();
  if (!expected) {
    return { error: "Registracija je zatvorena." };
  }

  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!code || !email || !password) {
    return { error: "Popuni sva polja." };
  }

  if (!secretsEqual(code, expected)) {
    return { error: "Pogrešan kod." };
  }

  if (password.length < 8) {
    return { error: "Lozinka mora imati bar 8 znakova." };
  }

  if (password !== password2) {
    return { error: "Lozinke se ne poklapaju." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("signUp failed", error);
    return { error: "Nalog nije napravljen. Pokušaj opet." };
  }

  // Supabase namerno ne kaže "taj mejl postoji" (da se spisak naloga ne curi),
  // nego vrati korisnika bez ijednog identiteta. Za nas je to "već postoji".
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Nalog sa tim mejlom već postoji. Idi na prijavu." };
  }

  // Sesija fali => potvrda mejla je ipak uključena u Supabase podešavanjima.
  if (!data.session) {
    return { ok: true, needsConfirm: true };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/prijava");
}

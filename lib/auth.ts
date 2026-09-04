import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * One check used by every protected page and server action.
 * cache() = React remembers the result for this one render, so we do not
 * ask Auth twice if both the page and a child call it.
 */
/**
 * Registracija je upaljena samo dok OWNER_SIGNUP_CODE postoji u env-u.
 * Kad klijent napravi svoj nalog: obriši ovu env varijablu na Vercelu
 * i uradi Redeploy — /registracija se sama zatvori, bez izmene koda.
 */
export function signupCode(): string | null {
  const code = process.env.OWNER_SIGNUP_CODE?.trim();
  return code ? code : null;
}

export function signupEnabled(): boolean {
  return signupCode() !== null;
}

export const requireOwner = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/prijava");
  }

  return user;
});

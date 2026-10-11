"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = { error: string } | null;

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
    if (error.status === 429) {
      return {
        error:
          "Previše pokušaja prijave. Sačekaj malo pa pokušaj ponovo.",
      };
    }
    // Ista poruka za nepoznat nalog, pogrešnu lozinku i nepotvrđen email.
    return { error: "Prijava nije uspela. Proveri email i lozinku." };
  }

  redirect("/admin");
}

export type ChangePasswordState = { error: string } | { ok: true } | null;

/**
 * Vlasnik sam menja lozinku, pa onaj ko mu je napravio nalog (privremenom
 * lozinkom) ne zna novu. Trenutnu lozinku tražimo namerno: ostavljena
 * otvorena tabla nije dovoljna da neko preuzme nalog.
 */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const claims = await requireOwner();
  const email = typeof claims.email === "string" ? claims.email : "";

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Popuni sva tri polja." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Nova lozinka mora imati bar ${MIN_PASSWORD_LENGTH} znakova.`,
    };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Nova lozinka i ponovljena lozinka se ne poklapaju." };
  }
  if (newPassword === currentPassword) {
    return { error: "Nova lozinka mora biti drugačija od trenutne." };
  }
  if (!email) {
    return { error: "Nalog nema email. Odjavi se i prijavi ponovo." };
  }

  const supabase = await createSupabaseServerClient();

  // updateUser ne pita za staru lozinku, pa je proveravamo prijavom.
  // Neuspešna prijava ne dira postojeću sesiju; uspešna je samo osveži.
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (checkError) {
    if (checkError.status === 429) {
      return { error: "Previše pokušaja. Sačekaj malo pa pokušaj ponovo." };
    }
    return { error: "Trenutna lozinka nije tačna." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    if (updateError.code === "weak_password") {
      return { error: "Nova lozinka je preslaba. Izaberi dužu ili složeniju." };
    }
    if (updateError.code === "same_password") {
      return { error: "Nova lozinka mora biti drugačija od trenutne." };
    }
    console.error("changePassword failed", updateError.code ?? updateError.status);
    return { error: "Lozinka nije promenjena. Pokušaj ponovo." };
  }

  // Ko se prijavio privremenom lozinkom na drugom uređaju, ostaje bez sesije.
  // Lozinka je već promenjena, pa greška ovde ne poništava uspeh.
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "others",
  });
  if (signOutError) {
    console.error("changePassword: sign out others failed", signOutError.status);
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/prijava");
}

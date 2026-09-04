import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { signupEnabled } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Skrivena ruta: nijedan link sa javnog sajta ne vodi ovde.
 * Brava nije skrivenost nego OWNER_SIGNUP_CODE — bez njega forme nema.
 */
export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  const open = signupEnabled();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-4 py-10">
      <p className="text-sm font-medium text-zinc-500">Šmrčko Potrčko</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Nalog vlasnika
      </h1>

      {open ? (
        <>
          <p className="mt-3 text-zinc-600">
            Napravi svoj nalog za tablu. Treba ti pozivni kod — bez njega
            registracija ne prolazi.
          </p>
          <SignupForm />
        </>
      ) : (
        <p className="mt-3 text-zinc-600">
          Registracija je zatvorena. Ako ti treba nalog, javi se onome ko
          održava sajt.
        </p>
      )}

      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/prijava" className="underline underline-offset-2">
          Već imaš nalog? Prijavi se
        </Link>
      </p>
    </div>
  );
}

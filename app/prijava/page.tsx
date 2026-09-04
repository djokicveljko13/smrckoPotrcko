import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { signupEnabled } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-4 py-10">
      <p className="text-sm font-medium text-zinc-500">Šmrčko Potrčko</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Prijava vlasnika
      </h1>
      <p className="mt-3 text-zinc-600">
        Tabla nije javna — tu su adrese i telefoni kupaca. Samo vlasnik ulazi.
      </p>

      <LoginForm />

      {/* Link postoji samo dok je OWNER_SIGNUP_CODE postavljen. Obrišeš kod
          sa Vercela → link nestane sam, bez izmene koda. */}
      {signupEnabled() ? (
        <p className="mt-6 text-sm text-zinc-500">
          <Link
            href="/registracija"
            className="underline underline-offset-2"
          >
            Nemaš nalog? Napravi ga
          </Link>
        </p>
      ) : null}

      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-2">
          Nazad na početnu
        </Link>
      </p>
    </div>
  );
}

import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { PasswordForm } from "@/components/admin/password-form";
import { requireOwner } from "@/lib/auth";
import { secondaryButtonClass } from "@/lib/ui";

/*
 * Nalog pravi Veljko u Supabase-u sa privremenom lozinkom; vlasnik je ovde
 * menja u svoju. Email prikazujemo da bude jasno čiji se nalog menja.
 */
export default async function AccountPage() {
  const claims = await requireOwner();
  const email = typeof claims.email === "string" ? claims.email : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-500">Samo vlasnik</p>
          <h1 className="mt-1 font-display text-3xl font-black italic uppercase tracking-tight">
            Lozinka
          </h1>
          {email ? (
            <p className="mt-1 text-sm text-zinc-500">
              Prijavljen nalog: <span className="font-bold text-ink">{email}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <AdminNav current="/admin/nalog" />
          <form action={signOut}>
            <button type="submit" className={secondaryButtonClass}>
              Odjavi se
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
        <p className="mb-5 text-sm text-zinc-600">
          Ako si dobio privremenu lozinku, promeni je ovde. Novu lozinku znaš
          samo ti.
        </p>
        <PasswordForm />
      </div>
    </div>
  );
}

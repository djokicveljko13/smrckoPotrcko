import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { PhoneOrderForm } from "@/components/admin/phone-order-form";
import { requireOwner } from "@/lib/auth";
import { secondaryButtonClass } from "@/lib/ui";

export default async function NewPhoneOrderPage() {
  await requireOwner();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-500">Samo vlasnik</p>
          <h1 className="mt-1 font-display text-3xl font-black italic uppercase tracking-tight">
            Unesi porudžbinu
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kupac je na vezi. Upiši isto što i na sajtu — kurir dobija Telegram.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <AdminNav current="/admin/nova" />
          <form action={signOut}>
            <button type="submit" className={secondaryButtonClass}>
              Odjavi se
            </button>
          </form>
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7">
        <PhoneOrderForm />
      </div>
    </div>
  );
}

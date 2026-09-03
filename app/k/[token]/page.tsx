import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefreshButton } from "@/components/admin/refresh-button";
import { CourierHome } from "@/components/courier/home";
import { CourierPinForm } from "@/components/courier/pin-form";
import {
  getCourierDashboard,
  getCourierFromSession,
  isAccessToken,
  peekCourierName,
} from "@/lib/courier-auth";
import { telegramConnectUrl } from "@/lib/telegram";
import type { CourierDashboardData } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kurir — Šmrčko Potrčko",
  robots: { index: false, follow: false },
};

export default async function CourierPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isAccessToken(token)) {
    notFound();
  }

  let courierName: string | null;
  try {
    courierName = await peekCourierName(token);
  } catch {
    return (
      <CourierShell>
        <p className="mt-4 text-sm font-semibold text-brand-dark" role="alert">
          Kurirska stranica nije spremna. SQL za prijavu treba da se pokrene u
          Supabase, pa osveži.
        </p>
      </CourierShell>
    );
  }

  if (!courierName) {
    notFound();
  }

  const session = await getCourierFromSession();
  const signedIn = session?.accessToken === token;

  if (!signedIn || !session) {
    return (
      <CourierShell>
        <h1 className="mt-2 font-display text-3xl font-black italic uppercase tracking-tight">
          Prijava kurira
        </h1>
        <CourierPinForm token={token} courierName={courierName} />
      </CourierShell>
    );
  }

  let dashboard: CourierDashboardData | null;
  try {
    dashboard = await getCourierDashboard();
  } catch {
    return (
      <CourierShell>
        <p className="mt-4 text-sm font-semibold text-brand-dark" role="alert">
          SQL za smenu i vožnje treba da se pokrene u Supabase, pa osveži.
        </p>
      </CourierShell>
    );
  }

  if (!dashboard) {
    return (
      <CourierShell>
        <h1 className="mt-2 font-display text-3xl font-black italic uppercase tracking-tight">
          Prijava kurira
        </h1>
        <CourierPinForm token={token} courierName={courierName} />
      </CourierShell>
    );
  }

  return (
    <CourierShell>
      <div className="flex items-start justify-between gap-3">
        <h1 className="mt-2 font-display text-3xl font-black italic uppercase tracking-tight">
          {session.name}
        </h1>
        <RefreshButton />
      </div>
      <CourierHome
        token={token}
        dashboard={dashboard}
        telegramConnectUrl={
          dashboard.telegramLinked ? null : telegramConnectUrl(token)
        }
      />
    </CourierShell>
  );
}

function CourierShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-1 flex-col px-4 py-10">
      <p className="text-sm font-bold text-zinc-500">Šmrčko Potrčko</p>
      {children}
    </div>
  );
}

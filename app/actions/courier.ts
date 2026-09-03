"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getCourierSessionToken,
  isAccessToken,
  requireCourier,
  setCourierSessionCookie,
} from "@/lib/courier-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendOffer } from "@/lib/telegram";

export type CourierLoginState = { error: string } | null;
export type CourierActionState = { error: string } | null;

const LOGIN_ERRORS: Record<string, string> = {
  bad_pin: "Pogrešan PIN.",
  locked: "Previše pogrešnih PIN-ova. Sačekaj 15 minuta ili zovi vlasnika.",
  no_pin: "PIN još nije postavljen. Traži od vlasnika.",
  bad_token: "Ovaj link nije važeći.",
};

const ACTION_ERRORS: Record<string, string> = {
  no_session: "Sesija je istekla. Unesi PIN opet.",
  no_offer: "Ponuda više nije važeća. Osveži stranicu.",
  not_active: "Ova vožnja nije aktivna. Osveži stranicu.",
  busy: "Već voziš drugu porudžbinu.",
};

const ORDER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function courierLogin(
  accessToken: string,
  _prev: CourierLoginState,
  formData: FormData,
): Promise<CourierLoginState> {
  if (!isAccessToken(accessToken)) {
    return { error: LOGIN_ERRORS.bad_token };
  }

  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return { error: "PIN ima tačno 6 cifara." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("courier_login", {
    p_access_token: accessToken,
    p_pin: pin,
  });

  if (error) {
    console.error("courier_login failed", error);
    return {
      error: "Prijava nije uspela. Ako si baš sada dodao SQL, osveži stranicu.",
    };
  }

  const result = data as
    | { ok: true; session_token: string }
    | { ok: false; error: string }
    | null;

  if (!result || typeof result !== "object") {
    return { error: "Prijava nije uspela. Pokušaj opet." };
  }

  if (!("ok" in result) || result.ok !== true) {
    const code =
      result && "error" in result && typeof result.error === "string"
        ? result.error
        : "bad_pin";
    return { error: LOGIN_ERRORS[code] ?? LOGIN_ERRORS.bad_pin };
  }

  if (
    typeof result.session_token !== "string" ||
    result.session_token.length === 0
  ) {
    return { error: "Prijava nije uspela. Pokušaj opet." };
  }

  await setCourierSessionCookie(result.session_token);
  redirect(`/k/${accessToken}`);
}

/*
 * Kurir nema nalog. Ne sme da radi supabase.from("orders").update(...)
 * jer bi onda mogao da dira tuđe porudžbine. Akcija samo predaje sesiju
 * i id porudžbine funkciji u bazi; funkcija proveri da je to ZAISTA
 * njegova ponuda / vožnja, pa tek onda menja status.
 */
export async function courierDashboardAction(
  accessToken: string,
  _prev: CourierActionState,
  formData: FormData,
): Promise<CourierActionState> {
  if (!isAccessToken(accessToken)) {
    redirect("/");
  }

  await requireCourier(accessToken);

  const sessionToken = await getCourierSessionToken();
  if (!sessionToken) {
    redirect(`/k/${accessToken}`);
  }

  const intent = String(formData.get("intent") ?? "");
  const supabase = await createSupabaseServerClient();

  let rpc: { data: unknown; error: { message: string } | null };

  if (intent === "shift_on" || intent === "shift_off") {
    rpc = await supabase.rpc("courier_set_shift", {
      p_session_token: sessionToken,
      p_on_shift: intent === "shift_on",
    });
  } else if (
    intent === "accept" ||
    intent === "decline" ||
    intent === "deliver"
  ) {
    const orderId = String(formData.get("order_id") ?? "");
    if (!ORDER_ID_RE.test(orderId)) {
      return { error: "Porudžbina nije prepoznata. Osveži stranicu." };
    }

    if (intent === "deliver") {
      rpc = await supabase.rpc("courier_mark_delivered", {
        p_session_token: sessionToken,
        p_order_id: orderId,
      });
    } else {
      rpc = await supabase.rpc("courier_respond_to_offer", {
        p_session_token: sessionToken,
        p_order_id: orderId,
        p_accept: intent === "accept",
      });
    }
  } else {
    return { error: "Nepoznata akcija. Osveži stranicu." };
  }

  if (rpc.error) {
    console.error("courier action failed", intent, rpc.error);
    return {
      error: "Nije upisano. Ako si baš sada dodao SQL, osveži stranicu.",
    };
  }

  const result = rpc.data as {
    ok?: boolean;
    error?: string;
    offered_courier_id?: unknown;
  } | null;
  if (!result || result.ok !== true) {
    const code = result?.error ?? "no_offer";
    if (code === "no_session") {
      redirect(`/k/${accessToken}`);
    }
    return { error: ACTION_ERRORS[code] ?? "Nije upisano. Osveži stranicu." };
  }

  const offeredId =
    typeof result.offered_courier_id === "string"
      ? result.offered_courier_id
      : null;
  await sendOffer(offeredId);

  revalidatePath(`/k/${accessToken}`);
  revalidatePath("/k/[token]", "page");
  return null;
}

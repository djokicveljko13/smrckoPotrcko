import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CourierDashboardData,
  CourierJob,
  OrderStatus,
} from "@/lib/types";

/*
 * Sesija = "ovaj telefon je već uneo tačan PIN".
 *
 * Posle uspešnog PIN-a baza upiše red u courier_sessions, a browser dobije
 * kolačić sa tim tokenom. Sledeći zahtev šalje kolačić sam — kurir ne kuca
 * PIN na svaki klik.
 *
 * Zašto httpOnly: JavaScript u stranici NE SME da pročita kolačić. Ako neki
 * skripta procuri na stranicu, ne može da ukrade sesiju. Vidi ga samo server.
 *
 * Zašto red u tabeli, a ne potpisan kolačić (JWT): vlasnik mora da može da
 * klikne „Poništi pristup" i da kurir ISTOG trenutka ispadne. Potpisan kolačić
 * važi dok ne istekne — server ga ne može opozvati. Red u tabeli možemo
 * DELETE-ovati, pa whoami vrati prazno i PIN ekran se vrati.
 */

export const COURIER_SESSION_COOKIE = "courier_session";
export const COURIER_SESSION_MAX_AGE_SEC = 12 * 60 * 60;

export const ACCESS_TOKEN_RE = /^[0-9a-f]{64}$/;

export type CourierIdentity = {
  courierId: string;
  name: string;
  accessToken: string;
};

export function isAccessToken(value: string): boolean {
  return ACCESS_TOKEN_RE.test(value);
}

export async function getCourierSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COURIER_SESSION_COOKIE)?.value ?? null;
}

export async function setCourierSessionCookie(sessionToken: string) {
  const store = await cookies();
  store.set(COURIER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/k",
    maxAge: COURIER_SESSION_MAX_AGE_SEC,
  });
}

export const getCourierFromSession = cache(
  async (): Promise<CourierIdentity | null> => {
    const store = await cookies();
    const sessionToken = store.get(COURIER_SESSION_COOKIE)?.value;
    if (!sessionToken) return null;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("courier_whoami", {
      p_session_token: sessionToken,
    });

    if (error || !data) return null;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") return null;

    const { courier_id, name, access_token } = row as {
      courier_id?: unknown;
      name?: unknown;
      access_token?: unknown;
    };

    if (
      typeof courier_id !== "string" ||
      typeof name !== "string" ||
      typeof access_token !== "string"
    ) {
      return null;
    }

    return { courierId: courier_id, name, accessToken: access_token };
  },
);

export async function peekCourierName(
  accessToken: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("courier_peek", {
    p_access_token: accessToken,
  });

  if (error) {
    console.error("courier_peek failed", error);
    throw error;
  }

  return typeof data === "string" && data.length > 0 ? data : null;
}

/** Actions call this. The page itself shows the PIN form instead of redirecting. */
export async function requireCourier(
  accessToken: string,
): Promise<CourierIdentity> {
  const courier = await getCourierFromSession();
  if (!courier || courier.accessToken !== accessToken) {
    redirect(`/k/${accessToken}`);
  }
  return courier;
}

export const getCourierDashboard = cache(
  async (): Promise<CourierDashboardData | null> => {
    const sessionToken = await getCourierSessionToken();
    if (!sessionToken) return null;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("courier_dashboard", {
      p_session_token: sessionToken,
    });

    if (error) {
      console.error("courier_dashboard failed", error);
      throw error;
    }

    return parseDashboard(data);
  },
);

/** Postgres numeric/integer ume da stigne kao broj ili kao string. */
function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseJob(value: unknown): CourierJob | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const status = row.status;
  if (
    typeof row.id !== "string" ||
    typeof row.public_number !== "string" ||
    typeof row.title !== "string" ||
    typeof row.shop !== "string" ||
    typeof row.address !== "string" ||
    typeof row.phone !== "string" ||
    (status !== "nova" &&
      status !== "poslata_kuriru" &&
      status !== "krenuo" &&
      status !== "isporuceno")
  ) {
    return null;
  }

  return {
    id: row.id,
    public_number: row.public_number,
    title: row.title,
    shop: row.shop,
    address: row.address,
    phone: row.phone,
    delivery_price: numberOrNull(row.delivery_price),
    distance_m: numberOrNull(row.distance_m),
    status: status as OrderStatus,
    offered_at: typeof row.offered_at === "string" ? row.offered_at : null,
  };
}

function parseDashboard(value: unknown): CourierDashboardData | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (row.ok !== true) return null;
  if (typeof row.on_shift !== "boolean") return null;

  const todayRaw = Array.isArray(row.today) ? row.today : [];

  return {
    onShift: row.on_shift,
    telegramLinked: row.telegram_linked === true,
    offer: parseJob(row.offer),
    active: parseJob(row.active),
    today: todayRaw
      .map(parseJob)
      .filter((job): job is CourierJob => job !== null),
  };
}

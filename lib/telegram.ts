import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildCourierMessage } from "@/lib/courier-message";

function botToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

function siteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/** Telegram rejects localhost URL buttons. Text still sends; the button waits for HTTPS. */
function isPublicHttpUrl(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

/** Deep link the courier opens once to bind this Telegram account. */
export function telegramConnectUrl(accessToken: string): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username) return null;
  return `https://t.me/${username}?start=${accessToken}`;
}

function asChatId(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value)) return value;
  return null;
}

/** Postgres numeric/integer ume da stigne kao broj ili kao string. */
function asNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

async function telegramApi(
  method: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  const token = botToken();
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN missing; skip", method);
    return false;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Telegram API failed", method, response.status, detail);
    return false;
  }

  return true;
}

export async function replyTelegram(
  chatId: number | string,
  text: string,
): Promise<void> {
  await telegramApi("sendMessage", { chat_id: chatId, text });
}

/**
 * After the database assigned a courier, wake them. Missing token / chat id
 * / service role only logs — the order row is already committed.
 */
export async function sendOffer(
  courierId: string | null | undefined,
): Promise<void> {
  if (!courierId) return;

  if (!botToken()) {
    console.warn("TELEGRAM_BOT_TOKEN missing; skip sendOffer");
    return;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing; skip sendOffer");
    return;
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data: courier, error: courierError } = await admin
      .from("couriers")
      .select("telegram_chat_id, access_token")
      .eq("id", courierId)
      .maybeSingle();

    if (courierError) {
      console.error("sendOffer courier lookup failed", courierError);
      return;
    }

    const chatId = asChatId(courier?.telegram_chat_id);
    const accessToken =
      typeof courier?.access_token === "string" ? courier.access_token : null;

    if (!chatId) {
      console.warn("sendOffer: courier has no telegram_chat_id", courierId);
      return;
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select(
        "public_number, title, shop, address, phone, delivery_price, distance_m",
      )
      .eq("courier_id", courierId)
      .eq("status", "poslata_kuriru")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("sendOffer order lookup failed", orderError);
      return;
    }

    if (
      !order ||
      typeof order.public_number !== "string" ||
      typeof order.title !== "string" ||
      typeof order.shop !== "string" ||
      typeof order.address !== "string" ||
      typeof order.phone !== "string"
    ) {
      console.warn("sendOffer: no pending offer for courier", courierId);
      return;
    }

    // Cena i razdaljina smeju da budu null — Google je mogao da zakaže.
    // Zato NISU deo provere iznad; poruka sama zna šta da napiše kad fale.
    const text = buildCourierMessage({
      public_number: order.public_number,
      title: order.title,
      shop: order.shop,
      address: order.address,
      phone: order.phone,
      delivery_price: asNumberOrNull(order.delivery_price),
      distance_m: asNumberOrNull(order.distance_m),
    });

    const origin = siteUrl();
    const pageUrl =
      origin && accessToken && isPublicHttpUrl(origin)
        ? `${origin}/k/${accessToken}`
        : null;

    const body: Record<string, unknown> = { chat_id: chatId, text };
    if (pageUrl) {
      body.reply_markup = {
        inline_keyboard: [
          [{ text: "Otvori porudžbinu", url: pageUrl }],
        ],
      };
    }

    await telegramApi("sendMessage", body);
  } catch (error) {
    console.error("sendOffer failed", error);
  }
}

/** Guest RPC only returns P-17. Look up who was assigned, then sendOffer. */
export async function sendOfferForPublicNumber(
  publicNumber: string,
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing; skip sendOffer");
    return;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("courier_id, status")
      .eq("public_number", publicNumber)
      .maybeSingle();

    if (error) {
      console.error("sendOfferForPublicNumber lookup failed", error);
      return;
    }

    if (
      data?.status === "poslata_kuriru" &&
      typeof data.courier_id === "string"
    ) {
      await sendOffer(data.courier_id);
      return;
    }

    console.warn(
      "sendOfferForPublicNumber: skip, order is",
      publicNumber,
      data?.status ?? "missing",
    );
  } catch (error) {
    console.error("sendOfferForPublicNumber failed", error);
  }
}

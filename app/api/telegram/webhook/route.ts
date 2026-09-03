import { timingSafeEqual } from "node:crypto";
import { ACCESS_TOKEN_RE } from "@/lib/courier-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { replyTelegram } from "@/lib/telegram";

export const runtime = "nodejs";

function secretsEqual(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function parseStartToken(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const match = text.match(/^\/start(?:@[A-Za-z0-9_]+)?\s+([0-9a-f]{64})\s*$/i);
  const token = match?.[1]?.toLowerCase() ?? "";
  return ACCESS_TOKEN_RE.test(token) ? token : null;
}

function chatIdFromMessage(message: Record<string, unknown>): number | string | null {
  const chat = message.chat;
  if (!chat || typeof chat !== "object") return null;
  const id = (chat as { id?: unknown }).id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string" && /^-?\d+$/.test(id)) return id;
  return null;
}

export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  if (expected.length === 0) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const received =
    request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secretsEqual(received, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("ok", { status: 200 });
  }

  const message =
    body &&
    typeof body === "object" &&
    "message" in body &&
    (body as { message?: unknown }).message &&
    typeof (body as { message: unknown }).message === "object"
      ? ((body as { message: Record<string, unknown> }).message)
      : null;

  if (!message) {
    return new Response("ok", { status: 200 });
  }

  const chatId = chatIdFromMessage(message);
  const token = parseStartToken(message.text);

  if (!chatId || !token) {
    return new Response("ok", { status: 200 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("couriers")
      .update({ telegram_chat_id: String(chatId) })
      .eq("access_token", token)
      .select("name")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        await replyTelegram(
          chatId,
          "Ovaj Telegram je već povezan sa drugim kurirem.",
        );
        return new Response("ok", { status: 200 });
      }
      console.error("telegram link failed", error);
      await replyTelegram(chatId, "Povezivanje nije uspelo. Pokušaj opet.");
      return new Response("ok", { status: 200 });
    }

    if (!data || typeof data.name !== "string") {
      await replyTelegram(chatId, "Ovaj link nije važeći.");
      return new Response("ok", { status: 200 });
    }

    await replyTelegram(
      chatId,
      `Povezano kao ${data.name}. Kad stigne ponuda, javiće se ovde.`,
    );
  } catch (error) {
    console.error("telegram webhook failed", error);
  }

  return new Response("ok", { status: 200 });
}

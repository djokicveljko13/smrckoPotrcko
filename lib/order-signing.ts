import { createHmac, timingSafeEqual } from "node:crypto";

type Purpose = "place" | "quote" | "shopping";

function signingSecret(): string {
  const secret = process.env.ORDER_SIGNING_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ORDER_SIGNING_SECRET must contain at least 32 characters");
  }
  return secret;
}

/** Potpis nije šifrovanje. Token ne ide u URL, log ili trajno skladište. */
export function signOrderValue(purpose: Purpose, value: unknown): string {
  const payload = Buffer.from(JSON.stringify({ version: 1, purpose, value })).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readOrderValue(token: string, purpose: Purpose): unknown {
  if (token.length > 20_000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const envelope = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return envelope?.version === 1 && envelope.purpose === purpose ? envelope.value : null;
  } catch {
    return null;
  }
}

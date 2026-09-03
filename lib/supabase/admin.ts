import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS. Server only — never import this from a
 * `"use client"` file, and never give the key a NEXT_PUBLIC_ prefix.
 *
 * Why it exists: the guest/courier keys cannot SELECT orders or
 * telegram_chat_id. After the database assigns a courier we still need to
 * read that row to send Telegram. This client is that exception.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

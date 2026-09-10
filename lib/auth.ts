import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * One check used by every protected page and server action.
 * cache() = React remembers the result for this one render, so we do not
 * ask Auth twice if both the page and a child call it.
 */
export const requireOwner = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/prijava");
  }

  return user;
});

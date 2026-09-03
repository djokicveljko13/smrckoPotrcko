"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { secondaryButtonClass } from "@/lib/ui";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className={secondaryButtonClass}
    >
      {pending ? "Osvežavam…" : "Osveži"}
    </button>
  );
}

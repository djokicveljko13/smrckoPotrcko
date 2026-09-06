"use client";

import { useState } from "react";

/*
 * Kurirski link je dugačak i mora da stigne kuriru bez greške u prekucavanju.
 * navigator.clipboard postoji samo u browseru, pa je ovo client komponenta.
 */
export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Poruka "Kopirano" nestane sama; bez ovoga bi stajala zauvek.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Stariji browseri i strane bez HTTPS nemaju clipboard API.
      setCopied(false);
      window.prompt("Kopiraj link ručno:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border-2 border-zinc-200 bg-white px-3 py-1 text-sm font-bold text-ink transition-colors hover:border-ink"
    >
      {copied ? "Kopirano ✓" : "Kopiraj link"}
    </button>
  );
}

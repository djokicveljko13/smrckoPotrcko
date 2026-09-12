"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneIcon } from "@/components/icons";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";

const HIDDEN_PREFIXES = ["/admin", "/prijava", "/registracija", "/k/"];

/**
 * Fiksno dugme za običan poziv, vidljivo na javnim stranicama.
 * Nestaje kad footer uđe u ekran — tamo je broj već u traci / kontaktu.
 */
export function CallFab() {
  const pathname = usePathname();
  const hiddenRoute = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) {
      setFooterInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  if (hiddenRoute || footerInView) return null;

  return (
    <a
      href={TEL_URL}
      aria-label={`Pozovi ${DISPLAY_PHONE}`}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-brand bg-white text-brand shadow-[0_8px_24px_-6px_rgba(196,30,58,0.55)] sm:left-5"
    >
      <PhoneIcon className="h-6 w-6" />
    </a>
  );
}

import Link from "next/link";
import { secondaryButtonClass } from "@/lib/ui";

const LINKS = [
  { href: "/admin", label: "Tabla" },
  { href: "/admin/nova", label: "Unesi porudžbinu" },
  { href: "/admin/kuriri", label: "Kuriri" },
] as const;

/**
 * Tabovi vlasničkog dela. Tabla ostaje operativni ekran;
 * unos i kuriri su zasebne strane da se ne mešaju sa karticama.
 */
export function AdminNav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <nav aria-label="Vlasnički deo" className="flex flex-wrap items-center gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === current ? "page" : undefined}
          className={
            link.href === current
              ? `${secondaryButtonClass} border-ink`
              : secondaryButtonClass
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

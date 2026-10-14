import Link from "next/link";
import { signOut } from "@/app/actions/auth";

const LINKS = [
  { href: "/admin", label: "Tabla" },
  { href: "/admin/kuriri", label: "Kuriri" },
  { href: "/admin/nalog", label: "Lozinka" },
] as const;

/**
 * Traka vlasničkog dela: tabovi su MESTA, ne akcije. „Unesi porudžbinu” je
 * akcija, pa je crveno dugme na tabli umesto još jednog taba. Odjava je sitan
 * link desno — retko se koristi i ne sme da se takmiči sa poslom.
 */
export function AdminNav({
  current,
}: {
  current: (typeof LINKS)[number]["href"] | "/admin/nova";
}) {
  return (
    <nav
      aria-label="Vlasnički deo"
      className="flex items-center gap-5 border-b-2 border-zinc-200"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === current ? "page" : undefined}
          // -mb-0.5 spušta podvlaku tačno preko sive linije trake.
          className={`-mb-0.5 border-b-2 py-3 text-sm font-bold transition-colors ${
            link.href === current
              ? "border-brand text-ink"
              : "border-transparent text-zinc-500 hover:text-ink"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <form action={signOut} className="ml-auto">
        <button
          type="submit"
          className="py-3 text-sm font-semibold text-zinc-400 transition-colors hover:text-brand-dark"
        >
          Odjavi se
        </button>
      </form>
    </nav>
  );
}

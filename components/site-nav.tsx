"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const NAV_LINKS = [
  { href: "/", label: "Poruči" },
  { href: "/kupovina", label: "Kupovina" },
  { href: "/cena", label: "Cena" },
  { href: "/saradnja", label: "Saradnja" },
  { href: "/lokacija", label: "Lokacija" },
];

export function SiteNav() {
  const pathname = usePathname();
  const showLogo = pathname === "/saradnja" || pathname === "/kupovina" || pathname === "/cena" || pathname === "/lokacija";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 motion-reduce:transition-none ${
        scrolled
          ? "bg-white text-ink shadow-sm"
          : "bg-transparent text-white"
      }`}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-end gap-x-3 gap-y-1 px-4 py-1.5 sm:gap-x-6">
        {showLogo ? (
          <Link
            href="/"
            aria-label="Šmrčko Potrčko — početna stranica"
            className="mr-auto shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            <BrandLogo className="h-auto w-24 sm:w-28" sizes="(max-width: 639px) 96px, 112px" onColor={!scrolled} priority />
          </Link>
        ) : null}
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-current px-4 font-display text-base font-extrabold sm:hidden"
        >
          {menuOpen ? "Zatvori" : "Meni"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path d={menuOpen ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <nav
          id="site-navigation"
          aria-label="Glavna navigacija"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenuOpen(false);
              document.querySelector<HTMLButtonElement>('[aria-controls="site-navigation"]')?.focus();
            }
          }}
          className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-stretch gap-1 border-b border-zinc-200 bg-white px-4 py-3 text-ink shadow-sm sm:static sm:flex sm:flex-row sm:items-center sm:gap-6 sm:border-0 sm:bg-transparent sm:p-0 sm:text-inherit sm:shadow-none`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`border-b-2 py-2 text-center font-display text-base font-extrabold leading-tight ${
                pathname === link.href
                  ? scrolled
                    ? "border-brand"
                    : "border-brand sm:border-white"
                  : "border-transparent"
              }`}
            >
              {link.label}
              {link.href === "/saradnja" ? (
                <span className="mt-0.5 block text-xs font-extrabold leading-none tracking-normal">
                  (za privatna lica)
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

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
];

export function SiteNav() {
  const pathname = usePathname();
  const showLogo = pathname === "/saradnja" || pathname === "/kupovina" || pathname === "/cena";
  const [scrolled, setScrolled] = useState(false);

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
            <BrandLogo className="h-auto w-24 sm:w-28" onColor={!scrolled} priority />
          </Link>
        ) : null}
        <nav aria-label="Glavna navigacija" className="flex items-center gap-4 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 py-2 text-center font-display text-base font-extrabold leading-tight ${
                pathname === link.href
                  ? scrolled
                    ? "border-brand"
                    : "border-white"
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

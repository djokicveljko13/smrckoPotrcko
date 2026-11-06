"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRightIcon } from "@/components/icons";
import { PARTNERS } from "@/lib/partners";

const NAV_LINKS = [
  { href: "/", label: "Poruči" },
  { href: "/kupovina", label: "Kupovina" },
  { href: "/cena", label: "Cena" },
  { href: "/saradnja", label: "Saradnja" },
  { href: "/lokacija", label: "Lokacija" },
];

export function SiteNav() {
  const pathname = usePathname();
  const showLogo = pathname === "/saradnja" || pathname === "/kupovina" || pathname === "/cena" || pathname === "/lokacija" || pathname.startsWith("/partneri");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const partnersRef = useRef<HTMLDivElement>(null);
  const partnersButtonRef = useRef<HTMLButtonElement>(null);

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

  // Klik bilo gde van liste partnera je zatvara. Sluša samo dok je lista otvorena.
  useEffect(() => {
    if (!partnersOpen) return;

    function handleClickOutside(event: PointerEvent) {
      if (!partnersRef.current?.contains(event.target as Node)) {
        setPartnersOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [partnersOpen]);

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
          className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-stretch gap-1 border-b border-zinc-200 bg-white px-4 py-3 text-ink shadow-sm sm:static sm:flex sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:text-inherit sm:shadow-none lg:gap-6`}
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

          <div
            ref={partnersRef}
            className="relative mt-1 sm:mt-0"
            onKeyDown={(event) => {
              if (event.key === "Escape" && partnersOpen) {
                event.stopPropagation(); // Escape zatvara samo listu, ne i ceo meni na telefonu
                setPartnersOpen(false);
                partnersButtonRef.current?.focus();
              }
            }}
          >
            {/* Na računaru je dugme belo dok je traka providna, a crveno kad traka pobeli. */}
            <button
              ref={partnersButtonRef}
              type="button"
              aria-expanded={partnersOpen}
              aria-controls="partners-list"
              onClick={() => setPartnersOpen(!partnersOpen)}
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 font-display text-base font-extrabold text-white shadow-[0_3px_0_rgba(112,14,10,0.55)] transition active:translate-y-0.5 active:shadow-none sm:w-auto ${
                scrolled ? "" : "sm:bg-white sm:text-brand-dark"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7" />
              </svg>
              Partneri
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${partnersOpen ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Na telefonu lista gura ostatak menija, a na računaru lebdi ispod dugmeta. */}
            {partnersOpen ? (
              <ul
                id="partners-list"
                className="animate-rise-in mt-2 rounded-2xl border border-zinc-200 bg-white p-2 text-left text-ink shadow-[0_18px_40px_-16px_rgba(16,16,16,0.45)] motion-reduce:animate-none sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-80"
              >
                {PARTNERS.map((partner) => (
                  <li key={partner.slug}>
                    <Link
                      href={`/partneri/${partner.slug}`}
                      onClick={() => {
                        setPartnersOpen(false);
                        setMenuOpen(false);
                      }}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100"
                    >
                      {partner.logo ? (
                        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                          {/* Naziv je odmah pored kao tekst, pa slika nema svoj opis. */}
                          <Image src={partner.logo} alt="" fill sizes="56px" className="scale-110 object-cover" />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1 font-display text-base font-black italic uppercase leading-tight tracking-tight">
                        {partner.name}
                      </span>
                      <ArrowRightIcon className="h-5 w-5 shrink-0 text-brand-dark transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}

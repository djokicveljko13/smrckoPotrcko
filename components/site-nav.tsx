"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react";
//usePathName nam govori na kojoj smo stranici
//kada uradimo const pathname=usePathname(); dobija iz url koja je stranica u pitanju.
const NAV_LINKS=[
    {href:"/",label:"Poruči"},
    {href:"/saradnja",label:"Saradnja"}

]
export function SiteNav(){
    const pathname=usePathname();
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
    return(
        <header
  className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 motion-reduce:transition-none ${
    scrolled
      ? "bg-white text-ink shadow-sm"
      : "bg-transparent text-white"
  }`}
>
  <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-end px-4">
        <nav aria-label="Glavna navigacija" className="flex items-center gap-6">
            {NAV_LINKS.map((link)=>(
                <Link
  key={link.href}
  href={link.href}
  className={`border-b-2 py-2 font-display text-base font-extrabold ${
    pathname === link.href
      ? (scrolled ? "border-brand" : "border-white")
      : "border-transparent"
  }`}
>
  {link.label}
</Link>
            ))}
        </nav>
         </div>
</header>
    )
}

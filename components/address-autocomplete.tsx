"use client";

import { useEffect, useRef, useState } from "react";
import { HomeIcon } from "@/components/icons";
import type { AddressSuggestion } from "@/lib/google/places";
import { fieldIconClass, fieldWithIconClass, labelClass } from "@/lib/ui";

/*
 * Polje "Adresa dostave" sa predlozima iz /api/adrese.
 *
 * Klijentska komponenta: ima stanje, tajmer (debounce) i reaguje na kucanje —
 * ništa od toga ne postoji na serveru.
 *
 * Serveru za cenu treba placeId, ne tekst adrese. Čuvamo ga u skrivenom
 * <input>, pa ga obična submit forma ponese uz ostala polja. Čim kupac promeni
 * tekst posle izbora, placeId se briše — inače bi cena važila za staru adresu.
 */
export function AddressAutocomplete() {
  const [text, setText] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  // Klik na predlog upiše tekst preko setText -> efekat bi odmah opet zvao
  // Google za taj isti tekst. Ova zastavica preskoči taj jedan prolaz.
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }

    const query = text.trim();
    let ignore = false;

    const timer = setTimeout(async () => {
      if (ignore) return;

      // Prekratko za pretragu — očisti listu (iz callback-a, ne iz tela efekta).
      if (query.length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      try {
        const res = await fetch("/api/adrese", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query }),
        });
        const data = await res.json();
        if (ignore) return;

        const list: AddressSuggestion[] = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [text]);

  function pick(s: AddressSuggestion) {
    justPicked.current = true;
    setText(s.text);
    setPlaceId(s.placeId);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor="address" className={labelClass}>
        Gde donosimo?
      </label>

      <div className="relative mt-1.5">
        <span className={fieldIconClass}>
          <HomeIcon />
        </span>
        <input
          id="address"
          name="address"
          required
          maxLength={400}
          autoComplete="off"
          className={fieldWithIconClass}
          placeholder="Ulica i broj, sprat / stan ako je potrebno"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPlaceId(""); // tekst se promenio -> stari placeId više ne važi
          }}
          onFocus={() => setOpen(suggestions.length > 0)}
          // Klik na predlog prvo obori fokus (onBlur), pa tek onda okine onClick.
          // Kratko kašnjenje da onClick stigne pre nego što sakrijemo listu.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
      </div>

      <input type="hidden" name="place_id" value={placeId} />

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-brand/10"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

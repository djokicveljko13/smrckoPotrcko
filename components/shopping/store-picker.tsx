"use client";

import { useState } from "react";
import { SHOPPING_STORES, type ShoppingStore } from "@/lib/pricing";

type StorePickerProps = {
  value: ShoppingStore | null;
  onChange: (id: ShoppingStore) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * Četiri radio kartice — logo + naziv, bez cene.
 * Cena živi samo u price-panelu ispod forme (jedan izvor istine za oko).
 * Običan <img>: ako logo fajla nema, onError prebacuje na naziv.
 */
export function StorePicker({ value, onChange, error, disabled }: StorePickerProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="font-display text-lg font-black italic uppercase tracking-tight sm:text-xl">
        Gde kupujemo?
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SHOPPING_STORES.map((store) => (
          <StoreCard
            key={store.id}
            id={store.id}
            label={store.label}
            logo={store.logo}
            selected={value === store.id}
            onSelect={() => onChange(store.id)}
          />
        ))}
      </div>
      {error ? (
        <p id="store-error" role="alert" className="mt-2 text-xs text-brand-dark">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function StoreCard({
  id,
  label,
  logo,
  selected,
  onSelect,
}: {
  id: ShoppingStore;
  label: string;
  logo: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white p-3 transition sm:p-4 ${
        selected
          ? "border-brand bg-brand/5 shadow-sm"
          : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <input
        type="radio"
        name="store"
        value={id}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      {logoFailed ? (
        <span className="font-display text-lg font-black italic uppercase text-ink">
          {label}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- lokalni SVG; fallback na naziv ako fajla nema
        <img
          src={logo}
          alt=""
          width={72}
          height={40}
          className="h-10 w-auto object-contain"
          onError={() => setLogoFailed(true)}
        />
      )}
      {!logoFailed ? <span className="text-sm font-bold text-ink">{label}</span> : null}
    </label>
  );
}

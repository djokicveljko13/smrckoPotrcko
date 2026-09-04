/*
 * Jedno mesto za izgled polja i dugmadi.
 *
 * Zašto konstante a ne copy-paste po komponentama: ista klasa je ranije stajala
 * u dve forme. Kad se promeni dizajn, promeniš ga ovde jednom umesto da tražiš
 * gde je sve prekucan isti string.
 */

/*
 * Polje u mirnom stanju ima SIV okvir, ne crven. Crveni okvir na praznoj formi
 * čita se kao "pogrešio si", a kupac još nije ni počeo da kuca. Crvena se pali
 * samo na fokus — tada je signal "ovde si sada", i to je jedina crvena u formi
 * osim CTA dugmeta.
 *
 * py-3.5 + text-base + border-2 = 56px visine, dovoljno za prst na telefonu.
 */
const fieldBaseClass =
  "w-full rounded-2xl border-2 border-zinc-200 bg-field px-4 py-3.5 " +
  "text-base font-medium text-ink placeholder:font-normal placeholder:text-zinc-400 " +
  "outline-none transition-colors hover:border-zinc-300 " +
  "focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15";

/** Polje bez ikonice: samo margina odozgo, tekst počinje od px-4. */
export const fieldClass = `mt-1.5 ${fieldBaseClass}`;

/**
 * Polje sa ikonicom levo. Margina ide na `relative` omotač (ikonica se centrira
 * po visini polja), a `pl-11` pravi mesto da tekst ne ulazi u ikonicu.
 */
export const fieldWithIconClass = `${fieldBaseClass} pl-11`;

/** Ikonica u polju: ne hvata klik, da fokus uvek ide na sam <input>. */
export const fieldIconClass =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400";

export const labelClass = "block text-sm font-bold text-ink";

/**
 * Glavno dugme. shadow ispod + pomeranje na :active daje osećaj pritiska —
 * to je taj "efekat" na dugmetu, bez ijedne linije JavaScripta.
 */
export const primaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand " +
  "px-5 py-3.5 font-display text-base font-extrabold uppercase tracking-wide text-white " +
  "shadow-[0_4px_0_var(--color-brand-dark)] transition sm:py-4 " +
  "hover:bg-brand-dark " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-brand-dark)] " +
  "disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:active:translate-y-0";

/**
 * CTA na crvenom heroju: bela podloga, crvena slova — obrnuto od dugmeta u
 * formi. Na crvenoj pozadini crveno dugme se ne vidi, a belo je najjači
 * mogući kontrast, pa oko odmah nađe jedinu stvar koja se klikće.
 *
 * Senka je tamnocrvena (ne crna) da izgleda kao da dugme baca senku na samu
 * pozadinu, a ne da lebdi nad nečim tamnim.
 */
export const heroButtonClass =
  "inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white " +
  "px-7 py-4 font-display text-base font-extrabold uppercase tracking-wide text-brand " +
  "shadow-[0_5px_0_rgba(112,14,10,0.55)] transition " +
  "hover:bg-red-50 " +
  "active:translate-y-[4px] active:shadow-[0_1px_0_rgba(112,14,10,0.55)] sm:px-9 sm:text-lg";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-white " +
  "px-4 py-2.5 text-sm font-bold text-ink transition-colors " +
  "hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

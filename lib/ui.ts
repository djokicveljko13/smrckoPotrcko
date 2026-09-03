/*
 * Jedno mesto za izgled polja i dugmadi.
 *
 * Zašto konstante a ne copy-paste po komponentama: ista klasa je ranije stajala
 * u dve forme. Kad se promeni dizajn, promeniš ga ovde jednom umesto da tražiš
 * gde je sve prekucan isti string.
 */

/** Sivo polje sa crvenim okvirom — okvir pojača kad polje dobije fokus. */
export const fieldClass =
  "mt-1.5 w-full rounded-xl border-2 border-brand/30 bg-field px-4 py-2.5 " +
  "text-base font-medium text-ink placeholder:font-normal placeholder:text-zinc-400 " +
  "outline-none transition-colors hover:border-brand/60 " +
  "focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15";

export const labelClass = "block text-sm font-bold text-ink";

/**
 * Glavno dugme. shadow ispod + pomeranje na :active daje osećaj pritiska —
 * to je taj "efekat" na dugmetu, bez ijedne linije JavaScripta.
 */
export const primaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand " +
  "px-5 py-3 font-display text-base font-extrabold uppercase tracking-wide text-white " +
  "shadow-[0_4px_0_var(--color-brand-dark)] transition-transform sm:py-4 " +
  "active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-brand-dark)] " +
  "disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:active:translate-y-0";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-white " +
  "px-4 py-2.5 text-sm font-bold text-ink transition-colors " +
  "hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

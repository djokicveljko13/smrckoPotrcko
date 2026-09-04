import { Fragment } from "react";

type Props = {
  text: string;
  className?: string;
  /** Koliko se čeka pre prve reči, u milisekundama. */
  delayMs?: number;
  /** Razmak između dve susedne reči, u milisekundama. */
  stepMs?: number;
};

/*
 * Tekst koji se "farba" reč po reč, s leva na desno.
 *
 * Zašto reč po reč a ne jedan potez preko celog pasusa: pasus se lomi u dva
 * ili tri reda, zavisno od širine ekrana. Jedan potez preko cele kutije
 * otkrivao bi sve redove istovremeno — kao da neko farba dva reda odjednom.
 * Reči idu u redu čitanja, pa se prvi red popuni s leva na desno, onda drugi.
 *
 * Zašto nema "use client": nema stanja ni tajmera. Svaka reč dobije svoj
 * animation-delay u HTML-u, dalje sve radi CSS. Nula JavaScripta u browseru.
 *
 * Razmak (`{" "}`) stoji IZMEĐU spanova, ne u njima: inline-block pojede
 * razmak na svom kraju, pa bi se reči slepile.
 */
export function PaintInText({
  text,
  className,
  delayMs = 250,
  stepMs = 55,
}: Props) {
  const words = text.split(" ");

  return (
    <p className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="inline-block animate-paint-in motion-reduce:animate-none"
            style={{ animationDelay: `${delayMs + i * stepMs}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </p>
  );
}

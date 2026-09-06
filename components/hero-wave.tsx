/*
 * Beli talas na dnu crvenog ekrana.
 *
 * preserveAspectRatio="none" je ovde ključ: normalno SVG čuva odnos stranica,
 * pa bi se talas na širokom ekranu ili odsekao ili ostavio prazninu. Sa "none"
 * mu dozvoljavamo da se razvuče po širini koliko treba, a visinu drži CSS
 * (h-16 / sm:h-28). Talas nema značenje za čitača ekrana — otud aria-hidden.
 *
 * -bottom-px (a ne bottom-0): kad browser skalira stranicu na npr. 110%,
 * između SVG-a i ivice sekcije zna da ostane pola piksela crvene linije.
 * Jedan piksel preklapanja to trajno rešava.
 */
export function HeroWave() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 -bottom-px h-16 w-full sm:h-28"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="#ffffff"
        d="M0 62C240 8 480 0 720 26s480 96 720 40v54H0z"
      />
    </svg>
  );
}

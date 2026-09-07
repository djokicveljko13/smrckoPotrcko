/*
 * Pocepana ivica: nejednaki veliki useci + sitni prelomi između njih.
 * Telefon dobija poseban, jednostavniji crtež: desktop detalji bi se na
 * uskom ekranu sabili i izgledali kao sitni zupci, umesto pocepanog papira.
 * Svetli sloj pomeren nekoliko piksela otkriva „vlakna” duž ivice.
 * Preklapanje -bottom-px sprečava tanku prazninu pri zumiranju browsera.
 */
const DESKTOP_TEAR =
  "M0 57L24 61L39 52L63 55L88 34L105 39L116 35L145 51" +
  "L161 48L192 67L214 61L230 66L253 54L275 58L294 47" +
  "L313 52L344 78L362 72L377 80L405 62L426 65L449 53" +
  "L470 56L501 32L519 41L538 37L561 53L587 49L608 62" +
  "L624 57L653 73L672 69L687 76L714 58L737 63L755 52" +
  "L784 56L814 83L832 77L848 86L872 64L891 68L917 48" +
  "L938 52L962 35L982 42L995 38L1026 57L1051 51L1070 63" +
  "L1087 59L1119 78L1138 72L1151 79L1178 56L1198 60" +
  "L1222 46L1240 51L1266 31L1283 39L1301 36L1328 58" +
  "L1347 53L1374 68L1392 63L1411 72L1440 58V120H0Z";

const MOBILE_TEAR =
  "M0 48L12 53L22 43L31 47L49 28L60 33L68 30L86 48" +
  "L98 44L116 63L125 59L134 66L151 48L162 52L176 39" +
  "L185 44L205 69L216 63L225 72L243 51L252 55L270 34" +
  "L281 40L290 35L308 53L320 48L339 67L348 61L359 65" +
  "L376 46L390 52V100H0Z";

export function HeroDivider() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 -bottom-px h-20 w-full sm:h-28"
      aria-hidden
    >
      <svg className="hidden h-full w-full sm:block" viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false">
        <path fill="#edcbc7" d={DESKTOP_TEAR} transform="translate(0 -6)" />
        <path fill="#ffffff" d={DESKTOP_TEAR} />
      </svg>
      <svg className="h-full w-full sm:hidden" viewBox="0 0 390 100" preserveAspectRatio="none" focusable="false">
        <path fill="#edcbc7" d={MOBILE_TEAR} transform="translate(0 -5)" />
        <path fill="#ffffff" d={MOBILE_TEAR} />
      </svg>
    </div>
  );
}

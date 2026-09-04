import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/*
 * Favicon — ikonica u tabu browsera, u bookmarkovima i na početnom ekranu
 * telefona.
 *
 * Zašto ne prosto `app/icon.png` = kopija logotipa: logo je 1200x583, dakle
 * duplo širi nego viši. Tab prikazuje ikonicu u kvadratu od ~16 piksela — ceo
 * logo bi se sveo na sivu crticu u kojoj se ne vidi ništa. Zato se seče samo
 * KURIR sa desne strane logotipa: crvena kapa i ranac se prepoznaju i na
 * 16 piksela.
 *
 * Zašto `icon.tsx` a ne slika: Next iz ovog fajla sam ispeče PNG i ubaci
 * <link rel="icon"> u <head>. Nema drugog fajla koji bi se raspao kad se
 * logo promeni — menja se logo.png, ikonica se sledeći put ispeče iz njega.
 */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/*
 * Slika se ne učitava sa URL-a nego se čita sa diska i pretvara u data URI
 * (sam sadržaj slike upisan u src). Kod se izvršava na serveru pri gradnji,
 * kada sajt još ne postoji na adresi sa koje bi mogao da skine /logo.png.
 *
 * Van komponente je namerno: pročita se jednom, a ne pri svakom zahtevu.
 */
const logoDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo.png"),
).toString("base64")}`;

/*
 * "Sečenje" bez alata za slike: mali prozor (64x64, overflow: hidden) i velika
 * slika pomerena ulevo. Vidi se samo ono što je u prozoru.
 *
 * Računica: 64 / 583 (visina logotipa) = 0.11, pa cela slika u tom uvećanju
 * ima 132px širine. Kurir počinje na oko 664. piksela originala, što je
 * 664 * 0.11 = 73px — toliko slike gura se levo od prozora.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUri}
          alt=""
          width={132}
          height={64}
          style={{ position: "absolute", top: 0, left: -73 }}
        />
      </div>
    ),
    { ...size },
  );
}

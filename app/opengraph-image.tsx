import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DISPLAY_PHONE, WORKING_HOURS_LABEL } from "@/lib/contact";

export const alt = "Šmrčko Potrčko — dostava u Jagodini i okolini";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSrc = `data:image/png;base64,${readFileSync(join(process.cwd(), "public", "logo.png")).toString("base64")}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "white", color: "#101010", borderBottom: "22px solid #df352d", padding: "35px 60px" }}>
      {/* ImageResponse crta sliku pri buildu; next/image nije za ovaj renderer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} width={550} height={267} alt="" />
      <div style={{ display: "flex", marginTop: 22, fontSize: 54, fontWeight: 700 }}>Dostava u Jagodini i okolini</div>
      <div style={{ display: "flex", marginTop: 16, fontSize: 29, color: "#52525b" }}>Hrana, namirnice, apoteka ili bilo šta drugo.</div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#b8241d" }}>{`${DISPLAY_PHONE} • Svaki dan ${WORKING_HOURS_LABEL}`}</div>
    </div>,
    size,
  );
}

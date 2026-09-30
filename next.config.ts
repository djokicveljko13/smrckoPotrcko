import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/icon", permanent: true }];
  },
  async headers() {
    const privatePaths = ["/admin/:path*", "/prijava/:path*", "/k/:path*", "/hvala/:path*", "/registracija/:path*", "/api/:path*"];
    const sources = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
      ? ["/:path*"] : privatePaths;
    return sources.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },

  // Lock Turbopack to this folder (avoids picking up a lockfile in the user home dir).
  turbopack: {
    root: process.cwd(),
  },

  /*
   * Gasi Next.js značku (crni krug sa "N") koja u dev-u lebdi u ćošku
   * stranice. To nije deo sajta — Next je sam ubacuje dok radi `next dev`,
   * pa se u kodu stranice i ne vidi. Na Vercelu je nikad nije ni bilo.
   * Cena: nestaje i indikator koji javlja da li se ruta renderuje statički;
   * to se i dalje vidi u `next build`.
   */
  devIndicators: false,
};

export default nextConfig;

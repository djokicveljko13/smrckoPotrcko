import type { MetadataRoute } from "next";
import { IS_PREVIEW, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // HTML stranice ostaju čitljive da robot može da vidi njihove noindex oznake.
    // API nije sadržaj za pretragu. Pravilo važi i za AI pretraživače.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

import type { MetadataRoute } from "next";
import { IS_PREVIEW, PUBLIC_PAGES, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Nema izmišljenih lastModified datuma pri svakom buildu.
  return IS_PREVIEW ? [] : Object.keys(PUBLIC_PAGES).map((path) => ({ url: siteUrl(path) }));
}

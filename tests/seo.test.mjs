import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

function environment(t, values) {
  for (const [key, value] of Object.entries(values)) {
    const previous = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
}

test("production SEO never uses local operational URLs and sitemap contains only public pages", (t) => {
  environment(t, { SITE_URL: undefined, NEXT_PUBLIC_SITE_URL: "http://localhost:3000", VERCEL_ENV: "production" });
  const seo = loadTypeScript("lib/seo.ts");
  const sitemap = loadTypeScript("app/sitemap.ts").default();
  assert.deepEqual(sitemap.map(({ url }) => url), [
    "https://smrckopotrcko.rs/", "https://smrckopotrcko.rs/kupovina",
    "https://smrckopotrcko.rs/cena", "https://smrckopotrcko.rs/saradnja",
    "https://smrckopotrcko.rs/lokacija",
  ]);
  const titles = new Set();
  for (const path of Object.keys(seo.PUBLIC_PAGES)) {
    const metadata = seo.publicMetadata(path);
    assert.equal(metadata.robots.index, true);
    assert.equal(metadata.alternates.canonical, `https://smrckopotrcko.rs${path}`);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.twitter.card, "summary_large_image");
    titles.add(metadata.title);
  }
  assert.equal(titles.size, 5);
  assert.equal(seo.NO_INDEX.index, false);
});

test("preview is noindex in metadata and response headers and publishes no sitemap URLs", async (t) => {
  environment(t, { SITE_URL: undefined, VERCEL_ENV: "preview" });
  const seo = loadTypeScript("lib/seo.ts");
  for (const path of Object.keys(seo.PUBLIC_PAGES)) assert.equal(seo.publicMetadata(path).robots.index, false);
  assert.deepEqual(loadTypeScript("app/sitemap.ts").default(), []);
  assert.equal(loadTypeScript("app/robots.ts").default().rules.disallow, "/");
  const headers = await loadTypeScript("next.config.ts").default.headers();
  assert.equal(headers[0].source, "/:path*");
  assert.equal(headers[0].headers[0].value, "noindex, nofollow");
});

test("private route families receive noindex even on redirects or non-HTML responses", async (t) => {
  environment(t, { VERCEL_ENV: "production" });
  const headers = await loadTypeScript("next.config.ts").default.headers();
  for (const route of ["admin", "prijava", "k", "hvala", "registracija", "api"]) {
    const rule = headers.find(({ source }) => source === `/${route}/:path*`);
    assert.equal(rule?.headers[0].value, "noindex, nofollow");
  }
  assert.ok(!headers.some(({ source }) => source === "/:path*"));
});

test("canonical override rejects localhost, insecure URLs and paths", (t) => {
  environment(t, { SITE_URL: "https://example.rs/", VERCEL_ENV: "production" });
  assert.equal(loadTypeScript("lib/seo.ts").SITE_URL, "https://example.rs");
  for (const value of ["http://example.rs", "https://localhost", "https://127.0.0.1", "https://example.rs/path", "https://example.rs/?query=1", "https://user:pass@example.rs"]) {
    process.env.SITE_URL = value;
    assert.throws(() => loadTypeScript("lib/seo.ts"));
  }
});

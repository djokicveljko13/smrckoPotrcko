# Partneri (restorani) — plan izrade, prvi partner Crispy Chicken Korner

Izvor istine za zahteve je AGENTS.md (odeljak **Partneri**). Ovaj fajl opisuje kako se to pravi.

## Zašto

Prvobitna ideja (23.10.2026) bila je jedna stranica za Crispy Chicken Korner (`/crispy-chicken-korner`, `lib/menu.ts`). Veljko želi da se to od starta projektuje kao **sistem za više restorana**: na početnoj ostaju „Donesi mi nešto” i „Kupovina”, a dodaje se istaknuta sekcija **Partneri**. Klik na partnera otvara njegovu stranu sa menijem: slike, cena, `−/+` količina, korpa, adresa, pregled (hrana + dostava + ukupno), potvrda. Porudžbina ide istim tokom kao sve ostale (tabla, auto-dodela, Telegram, mejl vlasniku).

Odluke (Veljko, 24.10.2026):
- **Meni je fajl u kodu po restoranu** (`lib/partners/<slug>.ts`), u obliku koji kasnije mehanički prelazi u tabelu.
- **URL:** `/partneri/[slug]` + spisak `/partneri`. Zamenjuje `/crispy-chicken-korner` iz AGENTS.md.
- **Slike stavki:** isečci iz `public/krilca/viber_image_2026-10-22_19-14-29-559.jpg`.
- **Umaci:** kupac samo čekira među ponuđenim, **besplatno**.

Ključna ideja dizajna: **izvor menija sme da se menja (fajl → baza), ali zapis porudžbine u bazi mora biti dobar od prvog dana**, jer ostaje. Zato stavke porudžbine čuvaju snimak (naziv, cena u tom trenutku), a ne samo id.

Način rada (AGENTS.md, „Cilj učenja”): faze jedna po jedna, za svaku prvo ZAŠTO, pa mala celina koda koju Veljko prekuca. Prva stvar u implementaciji je ažuriranje AGENTS.md.

---

## Arhitektura

### 1. Model menija — `lib/partners/`
- `types.ts` — po uzoru na Wolt: `Partner { slug, name, tagline, tags, address {street, city, postalCode}, phone, instagram?, logo?, cover, sauces, categories }` → `MenuCategory { id, name, description?, items }` → `MenuItem { id, name, description?, price, unit?, image?, available? }`.
- **Umaci (Veljko 24.10.2026):** `sauces: string[]` na restoranu, prikazani kao kućice na dnu porudžbine, besplatni, bez ograničenja. Stavke nemaju opcije ni grupe.
- `crispy-chicken-korner.ts` — podaci sa menija: Kombinacije (1170/2370/3470), Pravi sam (strips 90, batačići 70, krilca 70 po kom.), Piće (Pepsi 0,33 140, Nikšićko 0,5 160), umaci: Kečap, Ljutenica, 1000 ostrva, Čili, Garlic sos.
- `index.ts` — `PARTNERS` registar, `findPartner(slug)`, `findMenuItem(partner, id)`. Jedini izvor za prikaz, serversku cenu, sitemap i JSON-LD.
- Id-jevi stavki su **trajni** (idu u bazu); promena cene ne menja id.

### 2. Rute i UI
- `app/partneri/[slug]/page.tsx` — `generateStaticParams` iz registra, `dynamicParams = false`, `generateMetadata` iz podataka partnera, `notFound()` za nepoznat slug. Hero: zajednička crvena `hero-surface` + pocepana ivica (`HeroDivider`), naziv restorana kao H1, podnaslov o ponudi, „Dostavlja Šmrčko Potrčko”, „Pozovi restoran” (063 192 95 55).
- `app/partneri/page.tsx` — spisak partnera (kartice).
- `components/partners/` — `PartnerCard` (slika, naziv, opis, „Pogledaj meni”), `MenuSection`, `MenuItemCard` (slika, naziv, opis, cena, „Dodaj” → stepper `−/+`), `CartBar` (telefon: zalepljena za dno, broj + zbir; računar: bočni panel), `PartnerCheckout` (kućice za umake, adresa, detalji, telefon, napomena), `PartnerConfirmation` (popup: stavke, Hrana, Dostava, Ukupno).
- Korpa: `useReducer` u jednoj klijentskoj komponenti; čuva se u `sessionStorage` (osvežavanje ne briše korpu). Stavka korpe = `{ itemId, qty }`.
- **Početna — partneri u samom hero-u** (Veljko izabrao 24.10.2026): restoran mora da se vidi na prvom ekranu, bez skrola.
  - Ispod dugmeta „Poruči šta ti treba” stoji tihi natpis „Gladan? Poruči iz restorana:” i red sa **kompaktnim karticama partnera** (`PartnerHeroStrip`): bela kartica na crvenom, mala fotografija hrane, naziv, „Krilca · batačići · strips”, „od 1170 din →”. Cela kartica je link na `/partneri/<slug>`.
  - Ulazi poslednja, posle dugmeta (`animate-rise-in`, ~1250 ms), da ne krade pad naslova.
  - Da hero ne postane pretrpan: na telefonu manji logo (npr. `w-44`) i manji razmaci; kartica `max-w-md`, pune širine. Hero ostaje `min-h-dvh`.
  - Više partnera kasnije: isti red postaje horizontalni skrol (`snap-x`) + link „Svi restorani →” (`/partneri`). Kod se ne menja, samo registar raste.
  - `#poruci` (Donesi / Kupovina + forma) ostaje kako jeste. `SiteNav` dobija link „Partneri” → `/partneri` i `BrandLogo` levo na `/partneri*`.
  - AGENTS.md: traka partnera je samo na početnoj; `/saradnja` hero je ne dobija (ažurirati rečenicu „Sadržaj i animacije hero-a su isti na početnoj i `/saradnja`”).
- Slike: jednokratno iseći iz JPG-a (logo, 3 kombinacije, strips/batačići/krilca, Pepsi, Nikšićko) u `public/partneri/crispy-chicken-korner/*.webp`, prikaz preko `next/image`. Napomena: logo ima „Chiken” — u UI koristimo tekstualni naziv, logo samo kao sliku dok vlasnik ne ispravi.

### 3. Server — isti obrazac kao kupovina
Šablon: `lib/shopping-quote.ts`, `app/actions/prepare-shopping-order.ts`, `app/actions/create-shopping-order.ts`.
- `lib/partner-quote.ts`:
  - `preparePartnerQuote(formData)` — čita `partner`, `cart` (JSON `[{id, qty}]`), `sauces`, adresu (`readPlace`), telefon, detalje, napomenu. Proverava: poznat partner i stavke, `qty` 1–20, najviše 30 redova, umaci sa spiska restorana. **Cene računa server iz registra.** Dostava: `computeDistanceMeters(placeId)` + `deliveryPriceFromMeters` (iz `lib/google/routes.ts`, `lib/pricing.ts`). Potpis `signOrderValue("partner", quote)` (`lib/order-signing.ts`), rok 15 min, `id: randomUUID()`.
  - `confirmPartnerQuote(token, insert, notify)` — kao `confirmShoppingQuote`.
- `app/actions/prepare-partner-order.ts`, `app/actions/create-partner-order.ts` — tanki omotači, RPC `create_partner_order`, `notifyNewOrder` (`lib/notify-new-order.ts`).
- Reuse: `readString`, `readPlace`, `validPhone`, `validText`, `QUOTE_ID_RE`, `readCreatedOrder`, `MAX_ORDER_NOTE` iz `lib/order-validation.ts`; `AddressAutocomplete`, `ModalShell`, `CourierNoteField`.

### 4. Baza — nova migracija `supabase/migrations/202610xx_partner_orders.sql`
- `alter type public.order_type add value 'restoran'` (opšte ime, ne „crispy”).
- `orders`: `partner_slug text`, `items_total numeric`, `sauces text[]`; check: `order_type = 'restoran'` ⇔ `partner_slug is not null`.
- Nova tabela `order_items` (opšta, ne „crispy_items”): `order_id` (cascade), `sort_order`, `item_id text`, `name text` (snimak), `unit_price numeric` (snimak), `quantity int check 1..20`, `unique(order_id, sort_order)`. RLS: select za `authenticated`, anon ništa (isto kao `shopping_items`).
- RPC `create_partner_order(p_quote_id, p_partner_slug, p_title, p_shop, p_address, p_phone, p_delivery_price, p_distance_m, p_place_id, p_note, p_items_total, p_sauces text[], p_items jsonb)` → `jsonb {ticket, created}`, `on conflict (quote_id) do nothing`, poziva `offer_order_to_next_courier`. **Dva revoke-a** (`from public` i `from anon, authenticated`), grant samo `service_role`.
- `title` = sažetak („2× Za 1 osobu, 4× Strips”), `shop` = „Crispy Chicken Korner, Kneza Miloša 24, Jagodina” — tabla, `/k/{token}` i Telegram dugme „📍 Preuzimanje” rade bez posebnog koda.
- `courier_job_json`: + `partner_slug`, `items_total`, `sauces`, `order_items`.

### 5. Kurir, mejl, tabla
- `lib/types.ts`: `OrderType` + `"restoran"`, `OrderItem` tip; `CourierJob`/`BoardOrder` dobijaju `order_items`, `items_total`.
- `lib/courier-message.ts`: nova grana — Restoran, stavke (`• 2× Za 1 osobu = 2340 din`), `Umaci: Kečap, Garlic sos`, napomena, adresa, telefon, **Hrana / Dostava / NAPLATI UKUPNO**. Mejl vlasniku automatski dobija isti tekst.
- `lib/order-message.ts`: kolone + učitavanje `order_items` za `restoran`.
- `lib/courier-auth.ts` (parsiranje `order_type`), `components/courier/job-details.tsx`, `components/admin/order-card.tsx`, `app/admin/page.tsx` (select `order_items(...)`).
- `/hvala`: prikazuje ukupno (hrana + dostava) za restoran.

### 6. SEO
- `lib/seo.ts`: `PUBLIC_PAGES` je fiksna mapa — dodati metapodatke za `/partneri` i funkciju za strane partnera iz registra. `app/sitemap.ts` dodaje `/partneri` + sve partnere.
- `components/structured-data.tsx`: `Restaurant` sa svojim `@id` (`…/partneri/<slug>#restaurant`), adresa, telefon restorana, Instagram u `sameAs`, `hasMenu` iz registra. Bez ocena. OG slika = slika menija.

---

## Faze (jedna po jedna, objašnjenje pa kod)

0. **AGENTS.md** — odeljak Crispy prepraviti u „Partneri”: URL, registar u kodu, umaci besplatni (čekiranje), slike-isečci, `order_type = 'restoran'`, `order_items`. Pa `docs/featurePartneri.md` sa ovim planom.
1. **Model + podaci** — `lib/partners/*` + test (jedinstveni id-jevi, cene > 0). Pojmovi: registar, zašto trajni id, zašto snimak cene.
2. **Slike + statična strana partnera** — isečci, `/partneri/[slug]` samo prikaz menija, metadata, sitemap, JSON-LD. Pojam: `generateStaticParams`.
3. **Početna (traka partnera u hero-u) + navigacija + `/partneri`** — proveriti hero na 375 px i 1440 px da sve staje bez gužve.
4. **Korpa** (klijent) — reducer, stepper, umaci, `CartBar`, sessionStorage.
5. **Migracija** — Veljko je pušta u Supabase; provera SQL-om.
6. **Serverska ponuda + akcije + testovi** (`tests/partner-quote.test.mjs` po uzoru na `tests/shopping.test.mjs`: nepoznata stavka, izmenjena cena, nepoznat umak, istekla ponuda, ponovljena potvrda).
7. **Checkout UI** — adresa, popup (hrana/dostava/ukupno), potvrda, `/hvala`.
8. **Kurir/mejl/tabla** — poruka, `/k/{token}`, kartica na tabli; testovi `tests/order-email.test.mjs`, `tests/telegram-maps.test.mjs` proširiti.

## Otvoreno — pitati vlasnika (ne blokira faze 0–4)
- Kurir naplaćuje **hranu + dostavu** u kešu i predaje novac za hranu vlasniku? (pretpostavka plana)
- Formula dostave ista (start + 80 × km, min 200) — pretpostavka.
- Radno vreme restorana (za schema zapis); najmanja porudžbina?
- Buduće partnere van Kneza Miloša 24: dostava se računa od restorana ili od baze? Sada od baze (= isto za Crispy); `computeDistanceMeters` tada dobija opcioni `origin`.

## Verifikacija
- `npm test` (novi i postojeći testovi), `npm run lint`, `npm run build` (statičke strane partnera se generišu).
- Lokalno (`npm run dev`): početna → kartica Crispy u hero-u (vidljiva bez skrola na telefonu i računaru) → dodaj kombinaciju + strips → čekiraj umake na dnu → adresa iz Places → popup sa hrana/dostava/ukupno → potvrda → `/hvala`.
- U Supabase: red u `orders` (`order_type = 'restoran'`), redovi u `order_items` sa snimkom cene; ponovljena potvrda ne pravi drugi red.
- Telegram poruka kuriru i mejl vlasniku imaju stavke i ukupno; „📍 Preuzimanje” vodi na restoran; `/k/{token}` i tabla prikazuju stavke.
- `view-source` strane partnera: `title`, canonical, `Restaurant` JSON-LD; `/sitemap.xml` sadrži `/partneri` i stranu partnera.

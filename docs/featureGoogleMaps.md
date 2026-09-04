# Cena dostave po kilometru (Google Routes + Places)

Ovaj fajl je izvor istine za obračun cene dostave. **Ako se pravilo promeni u
hodu, prvo se menja ovaj fajl, pa onda kod.** Isto pravilo važi i za `AGENTS.md`.

Status: izrada u toku. Odeljak „Redosled izrade" na dnu prati dokle smo stigli.

## Kako radimo — učenje je deo zadatka

Veljko mora da razume **svaki** korak. Gotov kod bez razumevanja se ovde računa
kao neuspeh. Ritam je isti kao u [featureKurir.md](featureKurir.md): prvo ZAŠTO,
pojam običnim jezikom pre nego što se pojavi u kodu, mali diff, stani i proveri.

Novi pojmovi koje treba objasniti pre upotrebe, po fazama:

| Faza | Pojam koji se prvi put pojavljuje |
|---|---|
| 1 | zašto zaokruživanje naviše i zašto konstanta a ne env promenljiva |
| 2 | zašto `grant execute … to anon` znači „svako sa interneta"; šta je service role i zašto sme da upiše cenu |
| 3 | šta je `X-Goog-FieldMask`; šta je SKU i zašto `TRAFFIC_UNAWARE` ostaje besplatan |
| 3 | zašto API ključ ide kroz **naš** route, a ne direktno iz browsera |
| 4 | šta je debounce; zašto `placeId` mora da se poništi kad kupac nastavi da kuca |
| 5 | zašto se cena čita iz baze, a ne iz URL-a |

## Zašto ovo radimo

Danas je cena dostave dve konstante u `lib/pricing.ts` (`grad: 200`,
`van_grada: 250`), a kupac **sam** klikne zonu u formi. Dva problema:

1. Kupac na 12 km plaća isto kao kupac na 1 km — vožnja van grada jede kurira.
2. Kupac sam bira zonu. Ništa ga ne sprečava da uvek klikne „U gradu".

Klijent traži da cena prati stvarnu razdaljinu. Dogovorena formula:

```
cena = 30 + 80 × km,  zaokruženo naviše na 10 dinara
```

Primeri: 1.2 km → 130 din · 3.0 km → 270 din · 5.7 km → 490 din · 12 km → 990 din.
Na 2.1 km ispada 198 → 200, pa cene za blizu ostaju iste kao dosad — mušterije ne
osete skok.

Polazna tačka je uvek ista: **Кнеза Милоша 24, Јагодина**.

Ovo menja zahtev iz `AGENTS.md` („cena_dostave fiksno: grad 200, van grada 250 —
dve konstante u kodu") i vadi `zona` iz forme, pa se **`AGENTS.md` ažurira u
sklopu ovog posla** — to je pravilo samog repoa.

## Šta treba da razumeš pre koda

**Google Routes API** vraća razdaljinu i vreme između dve tačke po putu kojim
auto stvarno vozi (ne vazdušnu liniju). Endpoint:
`POST https://routes.googleapis.com/directions/v2:computeRoutes`.

Dve stvari koje se lako promaše:

- Zaglavlje `X-Goog-FieldMask` je **obavezno**. Google traži da unapred kažeš
  koja polja hoćeš (`routes.distanceMeters`). Bez toga vraća grešku, ne prazan
  odgovor.
- `routingPreference: "TRAFFIC_UNAWARE"` — ne uzima gužvu u obzir. Time ostajemo
  u **Essentials** SKU-u. `TRAFFIC_AWARE` je skuplji Pro SKU, a nama gužva ne
  treba jer cena zavisi samo od kilometraže.

**Places Autocomplete** rešava problem koji Routes sam ne rešava: „kod pekare,
žuta kuća" nema koordinate. Kupac kuca, dobija listu pravih adresa, klikne
jednu — i mi dobijamo `placeId`.

**Ključna ušteda:** Routes API prima `placeId` direktno kao odredište. Znači
**ne trebaju nam koordinate kupca**, pa ne moramo da zovemo ni Geocoding ni Place
Details. Dva Google poziva po porudžbini (autocomplete + routes), oba u
besplatnoj kvoti.

**Ključ ostaje na serveru.** Autocomplete ne zovemo iz browsera nego kroz **naš**
API route koji prosleđuje zahtev Google-u. Zato nema `NEXT_PUBLIC_GOOGLE_…`
promenljive, ne učitavamo Google-ov JS bundle, i sami crtamo padajuću listu u
postojećem stilu sajta.

**Cenu računa server, nikad browser.** Najvažnije pravilo ovde — vidi Fazu 2.

### Koliko ovo košta

Google je u martu 2025. ukinuo stari „$200 kredita za sve" i dao **10.000
besplatnih poziva mesečno po svakom SKU-u posebno**. Kvote se ne sabiraju između
API-ja, ali nama to ide u korist:

| SKU | Besplatno mesečno | Preko toga |
|---|---|---|
| Routes: Compute Routes Essentials | 10.000 | $5 / 1000 |
| Places: Autocomplete Requests | 10.000 | $2.83 / 1000 |

Za obim kakav klijent ima (~50 porudžbina dnevno = ~1.500 mesečno, plus kuckanje
po formi) ostajemo duboko unutar besplatnog.

**Ali kartica je obavezna.** Bez aktivnog billing naloga ključ ne radi uopšte,
čak ni unutar besplatne kvote.

## Dogovorena pravila

| Odluka | Izbor |
|---|---|
| Ruta | firma → kupac (radnja se ne uračunava) |
| Formula | `30 + 80 × km`, naviše na 10 din |
| Unos adrese | Places Autocomplete, kupac bira iz liste |
| Kad kupac vidi cenu | tek na `/hvala` posle slanja |
| Google zakaže | porudžbina **prolazi** sa `delivery_price = NULL` |
| Ručna izmena | samo kad cena nedostaje (nema popusta na izračunatu) |
| Zona | briše se iz forme, kolona ostaje zbog starih redova |
| Granica km | nema u V1 |
| Cenu vide | kupac na `/hvala`, kurir (strana + Telegram/WhatsApp), vlasnik na tabli |
| Telefonski unos | isti obračun (Faza 6, odloživo) |

**Preduslov:** Google Cloud projekat sa uključenom karticom, uključeni *Routes
API* i *Places API (New)*, ključ ograničen na te dve API-ja.

---

## Faza 1 — Formula i konstante

**Fajl:** `lib/pricing.ts` (prepisuje se)

Zameni `DELIVERY_PRICE_DIN` tabelu po zonama sa:

```ts
export const PRICE_BASE_DIN = 30;
export const PRICE_PER_KM_DIN = 80;

/** Polazna tačka: Кнеза Милоша 24, Јагодина. Geokodirano jednom, ručno. */
export const PICKUP = { latitude: 43.978_143, longitude: 21.268_273 } as const;

export function deliveryPriceFromMeters(meters: number): number {
  const km = meters / 1000;
  const raw = PRICE_BASE_DIN + PRICE_PER_KM_DIN * km;
  return Math.ceil(raw / 10) * 10;
}

export function deliveryPriceLabel(price: number): string { … }
export function distanceLabel(meters: number): string { … } // "4.2 km"
```

Koordinate su očitane ručno sa Google Maps (desni klik na tačku). Konstanta a ne
env promenljiva, jer se adresa firme ne menja i ne sme tiho da se razlikuje
između lokala i Vercela.

Postojeći `deliveryPriceLabel(zone)` menja potpis — zvaće se sa brojem umesto sa
zonom. Zovu ga `app/hvala/page.tsx` i `components/courier/job-details.tsx`.

## Faza 2 — Baza: nove kolone i ko sme da upiše cenu

**Novi fajl:** `supabase/migrations/2026…_distance_pricing.sql`

**Zašto ovo nije samo „dodaj kolonu":** danas `create_web_order` ima
`grant execute … to anon` (`20260831140000_offer_order_to_next_courier.sql:175`).
Anon ključ je javan — stoji u browseru. Znači bilo ko može da zove tu funkciju
direktno preko `curl`. Ako bismo dodali `p_delivery_price` kao parametar, svako
bi mogao da naruči dostavu za 0 dinara.

Trigger `set_order_defaults` baš zato **na silu briše** cenu za goste
(`20260830173000_fix_guest_order_defaults.sql:18`), a RLS polisa traži
`delivery_price is null` (`20260830170000_orders_and_couriers.sql:112`).

Rešenje: **browser više ne piše u bazu uopšte.** Gost šalje formu našem serveru,
server pozove Google, izračuna cenu i tek onda upiše — service role ključem koji
nikad ne napušta server.

Migracija radi:

1. Nove kolone:
   ```sql
   alter table public.orders
     add column distance_m integer,
     add column destination_place_id text;
   alter table public.orders alter column zone drop not null;
   ```
   `zone` ostaje u bazi zbog starih porudžbina, samo se više ne popunjava.

2. Trigger `set_order_defaults` — dozvoli `service_role` da upiše cenu:
   ```sql
   if auth.role() not in ('authenticated', 'service_role') then
     … new.delivery_price := null;
   end if;
   ```

3. `create_web_order` — `drop function` pa nova verzija (promena liste parametara
   ne prolazi kroz `create or replace`): bez `p_zone`, sa `p_delivery_price
   numeric`, `p_distance_m integer`, `p_place_id text`. Grantovi:
   ```sql
   revoke all on function public.create_web_order(…) from anon;
   grant execute on function public.create_web_order(…) to service_role;
   ```

4. Ukini polisu `orders_anon_insert_web`. Bez nje anon nema **nijedan** način da
   upiše red u `orders`. Inače ostaje rupa: RPC zatvoren, ali direktan REST
   insert otvoren — porudžbine bez cene i bez ponude kuriru.

5. Nova RPC `owner_set_delivery_price(p_order_id uuid, p_price numeric)` za
   `authenticated`. Dozvoli upis **samo ako je `delivery_price is null`**.
   Dogovoreno je da nema ručne izmene već izračunate cene, a to pravilo mora da
   stoji u bazi, ne samo u UI.

6. `courier_dashboard` JSON builder (`20260831150000_telegram_offer_notify.sql`)
   — zameni `'zone', o.zone` sa `'delivery_price', o.delivery_price,
   'distance_m', o.distance_m`.

**Ovde se staje i objašnjava pre nego što se pređe dalje** — grantovi i RLS su
najosetljiviji deo cele izmene.

## Faza 3 — Google klijenti

**Novi fajlovi:**

- `lib/google/env.ts` — čita `GOOGLE_MAPS_API_KEY`, po uzoru na
  `lib/supabase/env.ts`.
- `lib/google/routes.ts` — `computeDistanceMeters(placeId): Promise<number | null>`.
  `fetch` sa `X-Goog-Api-Key` + `X-Goog-FieldMask: routes.distanceMeters`,
  `travelMode: "DRIVE"`, `routingPreference: "TRAFFIC_UNAWARE"`,
  `AbortSignal.timeout(8_000)` — isti obrazac kao `lib/telegram.ts:55`.
- `lib/google/places.ts` — `suggestAddresses(input)`.
  `POST https://places.googleapis.com/v1/places:autocomplete` sa
  `includedRegionCodes: ["rs"]` i `locationBias` krugom ~30 km oko Jagodine, da
  se ne nude adrese iz Beograda.

Sve tri funkcije vraćaju „prazno" umesto da bacaju — porudžbina sme da prođe i
kad Google ćuti.

**Novi fajl:** `app/api/adrese/route.ts` — `runtime = "nodejs"`, prima
`{ input }`, vraća `[{ placeId, text }]`. Obrazac iz
`app/api/telegram/webhook/route.ts`. Minimum 3 znaka i provera dužine na serveru,
da neko ne napravi 10.000 poziva jednim skriptom.

## Faza 4 — Forma i hvala-stranica

**`components/address-autocomplete.tsx`** (novo, klijentska komponenta):
kontrolisan `<input>`, debounce ~300 ms, `fetch("/api/adrese")`, padajuća lista u
stilu iz `lib/ui.ts`. Klik na predlog upisuje tekst u vidljivo polje i `placeId`
u skriveni `<input name="place_id">`.

Ako kupac posle izbora nastavi da kuca, `placeId` se **briše** — inače bi cena
važila za staru adresu. Tastatura (strelice, Enter, Esc) mora da radi, kao što i
sadašnji radio trik u `guest-order-form.tsx:12-23` pazi na pristupačnost.

**`components/guest-order-form.tsx`**: obriši ceo `<fieldset>` sa zonom (linije
115-138) i `zoneOptionClass`; zameni `<input id="address">` novom komponentom; u
`useEffect` navigacija ide na `?broj=…&cena=…` umesto `&zona=…`.

**`app/actions/create-guest-order.ts`**:

```
pročitaj title / shop / address / phone / place_id
  ↓
placeId postoji?  →  computeDistanceMeters(placeId)
  ↓                        ↓ null (Google zakazao)
deliveryPriceFromMeters   price = null
  ↓
createSupabaseAdminClient().rpc("create_web_order", { …, p_delivery_price, p_distance_m, p_place_id })
  ↓
sendOfferForPublicNumber(broj)   ← cena je već u redu, pa je kurir vidi u Telegramu
```

Vraćeno stanje: `{ status: "ok", ticket, price: number | null }` umesto `zone`.

**`app/hvala/page.tsx`**: `zoneFromSearch` → `priceFromSearch` (samo cifre,
gornja granica). Ako cene nema: *„Cenu dostave ti javljamo pozivom"* umesto
ćutanja.

Cena u URL-u je samo prikaz. Merodavna vrednost je u bazi i tu je vide kurir i
vlasnik — kupac može da prepravi URL, ali time ništa ne menja.

## Faza 5 — Kurir, tabla, poruke

- **`lib/courier-message.ts`**: `MessageOrder` gubi `zone`, dobija
  `delivery_price` i `distance_m`. Red `Zona: …` → `Razdaljina: 4.2 km` +
  `Naplati dostavu: 370 din` (ili `Dostava: dogovor telefonom` kad je NULL).
  (Fajl se ranije zvao `lib/whatsapp.ts`; WhatsApp je izbačen, poruku sada
  šalje samo Telegram — `lib/telegram.ts:144` zove istu funkciju.)
- **`lib/telegram.ts`**: `select` (linija 119) i provera tipova (131-142) —
  `zone` van, `delivery_price` / `distance_m` unutra. Cena sme da bude `null`, pa
  provera ne sme da odbaci red zbog toga.
- **`lib/types.ts`**: `CourierJob` i `BoardOrder` — `zone` van,
  `delivery_price: number | null` i `distance_m: number | null` unutra.
  TypeScript odatle sam pokazuje svako mesto koje treba dirnuti.
- **`components/courier/job-details.tsx`**: linije 32-39 — umesto zone i
  `deliveryPriceLabel(job.zone)`, prikaži razdaljinu i iznos koji kurir naplaćuje.
- **`components/admin/order-card.tsx`**: linije 76-79 — umesto oznake zone, cena.
  Kad je `delivery_price` NULL: vidno upozorenje *„cena nije izračunata"* + malo
  polje za unos.
- **Novo:** `app/actions/set-delivery-price.ts` — `"use server"`,
  `requireOwner()` iz `lib/auth.ts`, poziv `owner_set_delivery_price`, pa
  `revalidatePath("/admin")`. Isti obrazac kao `app/actions/assign-courier.ts`.
- **`app/admin/page.tsx`** linija 11 — dodaj nove kolone u `select`.

## Faza 6 — Telefonski unos (nova funkcionalnost, može da se odloži)

⚠️ **Ovo je više od izmene cene.** Forma „Nova porudžbina" na tabli **ne postoji**
u kodu — `source: "telefon"` živi samo kao tip u `lib/types.ts:2` i PG enum. To je
faza 5 iz `AGENTS.md` i nije napisana.

Ako se radi sada: `components/admin/new-order-form.tsx` +
`app/actions/create-phone-order.ts`, koji koriste **istu** `AddressAutocomplete`
komponentu i istu `computeDistanceMeters` + `deliveryPriceFromMeters` logiku,
samo sa `source = 'telefon'`, bez mejla i bez `/hvala`. Vlasnik pročita cenu kupcu
na vezi.

Ako se odlaže: faze 1-5 su celovite i ništa se ne baca — telefonski unos kasnije
nasledi gotovu logiku.

## Faza 7 — Dokumentacija i env

- **`AGENTS.md`** — menja se odeljak *Porudžbina (tanka)* (`cena_dostave` više
  nije fiksna; `zona` više nije ulaz), *Tok V1 A3*, i spisak *Šta nije V1*
  (Google ulazi u scope, ali samo Routes/Places — **ne** Google login).
- **`.env.example`** — `GOOGLE_MAPS_API_KEY=`.
- `.env.local` sa pravim ključem — nikad na git.

---

## Provera da radi

1. `npx supabase db push` (ili nalepi migraciju u SQL Editor), pa `npm run dev`.
2. **Srećan tok:** `/` → kucaj „Кнеза Милоша" → padajuća lista se pojavi → klikni
   adresu → pošalji. `/hvala` mora da pokaže broj **i** cenu. U Supabase Table
   Editoru red ima `delivery_price`, `distance_m`, `destination_place_id`, a
   `zone` je NULL.
3. **Ručna provera formule:** uzmi `distance_m` iz reda i proveri
   `ceil((30 + 80 × m/1000) / 10) × 10` — mora se poklopiti sa prikazanom cenom
   do dinara.
4. **Fallback:** privremeno pokvari `GOOGLE_MAPS_API_KEY` u `.env.local` i
   pošalji porudžbinu. Mora da **prođe** sa cenom NULL, `/hvala` pokaže poruku bez
   iznosa, a na `/admin` kartica ima upozorenje i polje za unos. Upiši cenu ručno
   → pojavi se na kartici. Vrati ključ.
5. **Kurir:** otvori `/k/{token}` — vidi razdaljinu i iznos. Ako Telegram bot
   radi, poruka mora da sadrži red sa cenom.
6. **Bezbednost (obavezno):** iz terminala pokušaj direktan poziv anon ključem —
   ```
   curl -X POST "$URL/rest/v1/rpc/create_web_order" -H "apikey: $ANON" …
   ```
   mora da vrati **permission denied**. Isto i direktan `POST /rest/v1/orders`.
   Ovo je test da cena stvarno nije u rukama browsera.
7. `npx tsc --noEmit` — pošto `zone` izlazi iz `CourierJob` / `BoardOrder`,
   kompajler je najbrži način da se nađe zaboravljeno mesto.

---

## Redosled izrade

- [x] 1 — Formula i konstante (`lib/pricing.ts`). Privremeni `deliveryPriceLabel`
      overload (broj + zona) drži build čistim do Faze 4/5. `PICKUP` =
      43.978143, 21.268273 (Кнеза Милоша 24). `GOOGLE_MAPS_API_KEY` dodat u
      `.env.example` i `.env.local`.
- [x] 2 — Migracija `20260902120000_distance_pricing.sql`: kolone `distance_m` /
      `destination_place_id`, `zone` nije više `not null`, trigger propušta
      `service_role`, `create_web_order` bez `p_zone` + grant samo `service_role`,
      polisa `orders_anon_insert_web` obrisana, `owner_set_delivery_price` RPC,
      `courier_job_json` dobio `delivery_price` / `distance_m` (`zone` most do Faze 5).
      Popravka `20260902130000`: `revoke ... from public` ne hvata Supabase default
      privileges — revoke mora `from anon, authenticated` poimence. Provereno:
      anon ne sme ni `create_web_order` ni `owner_set_delivery_price`.
- [x] 3 — `lib/google/env.ts`, `lib/google/routes.ts`
      (`computeDistanceMeters`), `lib/google/places.ts` (`suggestAddresses`),
      `app/api/adrese/route.ts` (`runtime = "nodejs"`, min 3 / max 120 znaka).
      Sve tri google funkcije vraćaju prazno na grešku. Provereno pravim
      pozivom: autocomplete + routes rade, kartica aktivna, formula tačna.
- [x] 4 — `components/address-autocomplete.tsx` (debounce 300 ms, `ignore`
      zastavica, `justPicked` ref, skriveni `place_id`; strelice/Enter NISU
      urađene — opciono kasnije). `guest-order-form.tsx` bez zone.
      `create-guest-order.ts` čita `place_id` → `computeDistanceMeters` →
      `deliveryPriceFromMeters` → upis kroz `createSupabaseAdminClient`
      (service_role). `hvala/page.tsx`: `cena` iz URL-a, poruka kad fali.
      Provereno: `/`, `/hvala` (sa i bez cene), `/api/adrese` rade.
- [x] 5 — `lib/courier-message.ts` (bivši `lib/whatsapp.ts` — WhatsApp izbačen na
      zahtev klijenta): poruka nosi `Razdaljina` + `Naplati dostavu`, ili
      `dogovor telefonom` kad je cena NULL. `lib/telegram.ts` `select` + provere
      bez zone. `lib/types.ts` `CourierJob`/`BoardOrder`: `zone` van,
      `delivery_price`/`distance_m` unutra. `lib/courier-auth.ts` `parseJob`
      normalizuje brojeve. `job-details.tsx` i `order-card.tsx` prikazuju cenu;
      `order-card` ima upozorenje + `SetPriceForm` kad cena fali.
      `app/actions/set-delivery-price.ts` (RPC `owner_set_delivery_price`).
      `admin/page.tsx` `ORDER_COLUMNS`. Most `deliveryPriceLabel(zona)` uklonjen.
      Mrtvi `assign-courier.ts` obrisan. `npx next build` prolazi.
- [ ] 6 — Telefonski unos (odloživo — forma „Nova porudžbina" na `/admin` ne
      postoji u kodu, to je zaseban posao)
- [x] 7 — `AGENTS.md` usklađen (cena po km, zona van forme, Telegram, Google
      Routes/Places u scope). `.env.example` napomena o `NEXT_PUBLIC_SITE_URL` na
      Vercelu. Migracija `20260903190000` izbacuje `zone` iz `courier_job_json`.
      `ZONE_LABEL` (mrtav) uklonjen iz `lib/labels.ts`. `next build` prolazi.

Deploy: produkcija na https://smrcko-potrcko.vercel.app, Telegram webhook
postavljen, baza očišćena (brojač restartovan na P-1). Detalji u memoriji.

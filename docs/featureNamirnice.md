# Potrčko ide u kupovinu — nova usluga „kupovina iz marketa"

## Context

Šmrčko Potrčko danas zna samo jednu vrstu posla: *preuzmi nešto sa tačke A i donesi na tačku B*. Kupac upiše šta hoće, odakle, gde da se donese — i cena se izračuna iz kilometraže (`30 + 80 × km` → razredi 180–300 din).

Klijent sada uvodi drugu uslugu: **kurir ode u veliki market (Maxi, IDEA, Roda, Lidl) i sam kupi stvari sa kupčeve liste.** To je drugačiji posao — kurir ne preuzima gotov paket, već bira proizvode. Klijent za to ima **posebno dogovorenu, fiksnu cenu dostave**.

Cilj: nova javna ruta `/kupovina` sa UX-om koji izgleda kao **papirna ceduljica za kupovinu**, a ne kao web forma. Ista `orders` tabela, ista auto-dodela kurira, isti Telegram — samo nova vrsta reda i nova tabela stavki.

### Odluke donete sa vlasnikom (07.09.2026)

| Pitanje | Odluka |
|---|---|
| Cena | **Fiksna po lancu**, ne po kilometraži: **Maxi / Roda / IDEA = 500 din**, **Lidl = 1000 din** |
| Kilometraža | **Ne računa se uopšte** za kupovinu. Nema Google Routes poziva. |
| Izbor radnje | **Obavezan.** Tačno četiri opcije: Maxi, Roda, IDEA, Lidl. Nema „Svejedno", nema „Drugo". |
| Ulaz u UI | **Zasebna ruta `/kupovina`** + kartice na početnoj koje vode tamo. |
| Naziv usluge | **„Potrčko ide u kupovinu"** |
| Čuvanje liste | **Zasebna tabela `shopping_items`** |
| Čekiranje kod kurira | **Ne sada** — kurir samo čita listu. Struktura to podržava kasnije. |
| Glasovni unos | **Ne radimo zasad.** |
| Telefonski unos kupovine na tabli | **Ne sada.** |
| Limit liste | 30 stavki × 120 znakova |

**Posledica cene po lancu:** izbor radnje prestaje da bude ukras — on **određuje cenu**. Zato:
1. izbor je obavezan (bez njega server ne zna koliko da naplati);
2. izbor stoji **iznad** papira, jer korisnik mora videti cenu pre nego što uloži trud u pisanje liste — inače izabere Lidl na kraju i doživi neprijatno iznenađenje od 1000 din;
3. cena se **nikad** ne čita iz forme. Browser šalje samo `store` (npr. `"lidl"`), a server iz svoje mape izvodi iznos. Da šaljemo cenu, svako bi `curl`-om naručio Lidl za 1 din.

---

## 1. Trenutno stanje

### Tok standardne porudžbine (danas)

```
[components/guest-order-form.tsx]  klijent kuca formu
        │  submit
        ▼
[app/actions/prepare-guest-order.ts]  "use server"
        └─► [lib/order-quote.ts] prepareOrderQuote()
              ├─ validacija polja (ručna, bez Zod-a)
              ├─ readPlace(): proverava HMAC „proof" iz AddressAutocomplete
              ├─ [lib/google/routes.ts] computeDistanceMeters(placeId)   ← Google Routes
              ├─ [lib/pricing.ts] deliveryPriceFromMeters(m)
              └─ [lib/order-signing.ts] signOrderValue("quote", quote)   ← HMAC, TTL 15 min
        │  vraća { quote, token } — NIŠTA nije upisano u bazu
        ▼
[components/order-confirmation.tsx]  native <dialog>, prikaz cene
        │  korisnik klikne „Potvrdi"
        ▼
[app/actions/create-guest-order.ts]  "use server"
        └─► [lib/order-quote.ts] confirmOrderQuote(token, insert, notify)
              ├─ readOrderValue(token, "quote") — potpis i rok
              ├─ insert: admin.rpc("create_web_order", …)  ← SERVICE_ROLE ključ
              │     └─ [SQL] insert u orders → trigger daje P-17 i courier_token
              │        → perform offer_order_to_next_courier(id)
              └─ notify: [lib/telegram.ts] sendOfferForPublicNumber("P-17")
                    └─ [lib/courier-message.ts] buildCourierMessage() → Telegram
        ▼
/hvala?broj=P-17&cena=300
```

**Ključna stvar koju moramo poštovati:** browser **nikad** ne piše u bazu. Anon ključ nema *nijednu* RLS polisu ni na jednoj tabeli. Upis ide isključivo preko `security definer` RPC-a koji sme da pozove samo `service_role` — a taj ključ nikad ne napušta server. Novi tok mora raditi isto.

### Relevantni fajlovi

| Sloj | Fajl |
|---|---|
| Forma | `components/guest-order-form.tsx` |
| Adresa | `components/address-autocomplete.tsx` → `app/api/adrese/route.ts` |
| Modal | `components/order-confirmation.tsx` |
| Logika ponude | `lib/order-quote.ts` |
| Potpis | `lib/order-signing.ts` — `type Purpose = "place" \| "quote"` |
| Cena | `lib/pricing.ts` |
| Tipovi | `lib/order-types.ts`, `lib/types.ts` |
| Server actions | `app/actions/prepare-guest-order.ts`, `app/actions/create-guest-order.ts` |
| Supabase | `lib/supabase/admin.ts` (service_role), `lib/supabase/server.ts` (anon+cookies) |
| Telegram | `lib/telegram.ts`, `lib/courier-message.ts` |
| Tabla | `app/admin/page.tsx`, `components/admin/order-card.tsx` |
| Kurir | `app/k/[token]/page.tsx`, `components/courier/job-details.tsx` |
| Stil | `lib/ui.ts` (klase kao stringovi), `app/globals.css` (Tailwind v4 `@theme`) |

### Baza — šta postoji

`orders`: `id, public_number, title*, shop*, address*, phone*, zone, source*, delivery_price, status*, courier_id, assigned_at, courier_token*, created_at, updated_at, distance_m, destination_place_id` (`*` = NOT NULL).
Enumi: `order_source ('sajt','telefon')`, `order_status ('nova','poslata_kuriru','krenuo','isporuceno')`.
Nema `order_type`. Nema nijedne tabele za stavke.

**Ovo je ključ celog plana:** `title` i `shop` su `NOT NULL` i **već ih čitaju tabla, Telegram poruka i kurirska stranica**. Ako ih za kupovinu popunimo izvedenim vrednostima, sav postojeći prikaz radi bez ijedne izmene.

---

## 2. Predlog UX-a

### Početna `/` — samo dodajemo izbor iznad postojeće forme

```
DESKTOP                                    MOBILE
┌────────────────────────────────────┐    ┌──────────────┐
│  (postojeći crveni hero, netaknut) │    │  HERO        │
└────────────────────────────────────┘    └──────────────┘
┌──── #poruci ───────────────────────┐    ┌──────────────┐
│    KAKO DA TI POMOGNEMO?           │    │ KAKO DA TI…  │
│ ┌──────────────┐ ┌───────────────┐ │    │┌────────────┐│
│ │ 📦           │ │ 🛒            │ │    ││ 📦 Donesi  ││
│ │ DONESI MI    │ │ POTRČKO IDE   │ │    ││ mi nešto   ││
│ │ NEŠTO        │ │ U KUPOVINU    │ │    │└────────────┘│
│ │ Preuzmemo iz │ │ Napiši listu, │ │    │┌────────────┐│
│ │ radnje i     │ │ mi kupimo i   │ │    ││ 🛒 Potrčko ││
│ │ donesemo     │ │ donesemo      │ │    ││ ide u      ││
│ │              │ │               │ │    ││ kupovinu   ││
│ │ [aktivna]    │ │  → /kupovina  │ │    │└────────────┘│
│ └──────────────┘ └───────────────┘ │    │              │
│  ┌──────────────────────────────┐  │    │ ┌──────────┐ │
│  │ postojeća forma dostave      │  │    │ │ postojeća│ │
│  └──────────────────────────────┘  │    │ │ forma    │ │
└────────────────────────────────────┘    └──────────────┘
```

Kartica „Donesi mi nešto" je **statična** (pokazuje da si tu); kartica „Potrčko ide u kupovinu" je `<Link href="/kupovina">`. Nema JS, nema tab-state-a — samo dva `<article>` u `sm:grid-cols-2`.

### `/kupovina` — papirna lista

```
DESKTOP (max-w-2xl)                        MOBILE (puna širina, px-4)
┌─── SiteNav (fiksna) ──────────────┐      ┌──────────────────────┐
├───────────────────────────────────┤      │ hero 55vh            │
│  crveni hero, min-h-[55vh]        │      │ POTRČKO IDE U        │
│  POTRČKO IDE U KUPOVINU           │      │ KUPOVINU             │
│  Napiši listu — mi kupimo i       │      └──────────────────────┘
│  donesemo na vrata.               │      ~~~ bela talasna ivica ~
│ ~~~~~~~ HeroWave ~~~~~~~~~~~~~~~~ │      ┌──────────────────────┐
├───────────────────────────────────┤      │ ┌──────────────────┐ │
│   ┌─ izbor radnje ─────────────┐  │      │ │ GDE KUPUJEMO?    │ │
│   │  GDE KUPUJEMO?             │  │      │ │┌───────┐┌───────┐│ │
│   │ ┌──────┐┌──────┐┌──────┐   │  │      │ ││ [logo]││ [logo]││ │
│   │ │[logo]││[logo]││[logo]│   │  │      │ ││ MAXI  ││ RODA  ││ │
│   │ │ MAXI ││ RODA ││ IDEA │   │  │      │ │└───────┘└───────┘│ │
│   │ └──────┘└──────┘└──────┘   │  │      │ │┌───────┐┌───────┐│ │
│   │ ┌──────┐                   │  │      │ ││ [logo]││ [logo]││ │
│   │ │[logo]│ ← izabrano        │  │      │ ││ IDEA  ││ LIDL ✓││ │
│   │ │ LIDL │   (crvena ivica)  │  │      │ │└───────┘└───────┘│ │
│   │ └──────┘                   │  │      │ └──────────────────┘ │
│   └────────────────────────────┘  │      │ ┌──────────────────┐ │
│   ┌─ papir (blaga rotacija) ───┐  │      │ │ ŠTA KUPUJEMO     │ │
│   │  ŠTA KUPUJEMO DANAS?       │  │      │ │ DANAS?           │ │
│   │  Napiši šta ti treba.      │  │      │ ├──────────────────┤ │
│   ├────────────────────────────┤  │      │ │ ☐ 2x mleko    ⋮ ✕│ │
│   │ ☐  2x mleko        ↑↓  ✕  │  │      │ ├──────────────────┤ │
│   ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  │      │ │ ☐ hleb        ⋮ ✕│ │
│   │ ☐  hleb            ↑↓  ✕  │  │      │ ├──────────────────┤ │
│   ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  │      │ │ ☐ 10 jaja     ⋮ ✕│ │
│   │ ☐  10 jaja         ↑↓  ✕  │  │      │ ├──────────────────┤ │
│   ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  │      │ │ ☐ ▏(kucaj…)      │ │
│   │ ☐  ▏kucaj ovde…           │  │      │ ├──────────────────┤ │
│   ├────────────────────────────┤  │      │ │ + Dodaj stavku   │ │
│   │  + Dodaj stavku      3/30  │  │      │ └──────────────────┘ │
│   └────────────────────────────┘  │      │  ┌────────────────┐  │
│   ┌─ bela kartica ─────────────┐  │      │  │ Napomena  ▸    │  │
│   │ ▸ Napomena za Potrčka      │  │      │  │ Adresa ………     │  │
│   │                            │  │      │  │ Sprat/stan ……  │  │
│   │ Gde donosimo?  [………]       │  │      │  │ Telefon ………    │  │
│   │ Sprat/stan     [………]       │  │      │  │╔══════════════╗│  │
│   │ Telefon        [………]       │  │      │  │║ CENA DOSTAVE ║│  │
│   │ ╔════════════════════════╗ │  │      │  │║              ║│  │
│   │ ║  CENA DOSTAVE          ║ │  │      │  │║   1000 din   ║│  │
│   │ ║                        ║ │  │      │  │║              ║│  │
│   │ ║      1000 din          ║ │  │      │  │║ Lidl · keš   ║│  │
│   │ ║                        ║ │  │      │  │╚══════════════╝│  │
│   │ ║  Lidl · plaćanje keš   ║ │  │      │  │ ┌────────────┐ │  │
│   │ ╚════════════════════════╝ │  │      │  │ │ POŠALJI    │ │  │
│   │ ┌────────────────────────┐ │  │      │  │ │ POTRČKA U  │ │  │
│   │ │ POŠALJI POTRČKA U KUP. │ │  │      │  │ │ KUPOVINU   │ │  │
│   │ └────────────────────────┘ │  │      │  │ └────────────┘ │  │
│   └────────────────────────────┘  │      │  └────────────────┘  │
├───────────────────────────────────┤      └──────────────────────┘
│  ContactStrip + AnnouncementBar   │
└───────────────────────────────────┘
```

**Kartice radnji nose samo logo i naziv — bez cene.** Cena živi na jednom mestu: u izraženom polju neposredno iznad dugmeta, i menja se čim promeniš radnju.

**Zašto cenovno polje baš tu:** to je poslednja stvar koju oko vidi pre klika, a klik je trenutak obavezivanja. Recikliramo postojeći recept iz `components/order-confirmation.tsx`: `rounded-2xl bg-brand/5 p-4` sa iznosom u `font-display text-4xl font-black italic text-brand`. Isti vizuelni jezik kao modal potvrde — korisnik vidi isti prikaz dvaput i to gradi poverenje.

**Zašto izbor radnje stoji IZNAD papira:** prirodan redosled razmišljanja — prvo odlučiš gde ideš, pa praviš listu za to mesto. Logotipi na vrhu su i vizuelno jak ulaz u stranicu.

**Zašto četiri kartice, a ne `<select>` padajući meni:** logotip je prepoznatljiviji od reda teksta u meniju — oko ga uhvati bez čitanja. Sa četiri opcije meni ništa ne štedi, a košta jedan dodir više. Pravi se kao `<fieldset>` sa `<input type="radio" class="peer sr-only">` i `<label>` koji nosi izgled — tastatura i screen reader dobiju pravi radio, oko dobije karticu.

**Logotipi:** `SHOPPING_STORES` dobija polje `logo` koje pokazuje na `/public/prodavnice/{id}.svg`. Ako fajla nema, kartica prikaže naziv u `font-display` i sve i dalje radi — pa Faza 3 ne čeka dizajn. Fajlove treba obezbediti (v. „Otvoreno").

**Zašto papir, pa ostatak u beloj kartici ispod:** papir je zvezda i mora da diše. Adresa i telefon su „administracija" — da su na papiru, metafora bi pukla (niko ne piše svoj broj telefona na listu za pijacu). Tri vizuelna sloja = tri jasne mentalne celine: *gde → šta → kome*.

**Dizajn papira (moderno, ne skeuomorfno):**
- Podloga `#fffdf7` (topla off-white), ivica `border border-[#e8e0cc]`, `rounded-2xl`
- Senka: `shadow-[0_18px_45px_-24px_rgba(16,16,16,0.45)]` — ista porodica kao postojeće kartice
- Rotacija `sm:-rotate-[0.4deg]` — **samo od `sm:` naviše**; na mobilu ravno, jer bi rotiran papir pune širine sekao ivice
- Linije reda: `border-b border-dashed border-[#ddd3ba]`
- Kvadratić: **dekorativan `<span aria-hidden>`**, ne pravi `<input type=checkbox>` — kupac ništa ne čekira, pa pravi checkbox bio bi laž prema screen readeru
- Naslov: postojeći `font-display` (Archivo black italic uppercase). **Ne uvodimo rukopisni font** — još jedan Google Font je još jedan network request, a Archivo italic već nosi karakter. Ako posle vizuelno fali „ručnosti", to je jedna linija u `layout.tsx` kasnije.
- Tekst stavki: `font-sans` (Jakarta), `text-base` (16px — sprečava iOS zoom na fokus)

**Interakcija reda:** kontrolisano React stanje. `Enter` = nov red ispod + fokus na njega. `Backspace` na praznom redu = briši red + fokus na prethodni. `↑/↓` dugmići za redosled (drag&drop bi tražio biblioteku — van scope-a). Brojač `3/30`.

---

## 3. User flow

```
Početna /
   │  klik na karticu „Potrčko ide u kupovinu"
   ▼
/kupovina
   │  1. radnja: Maxi / Roda / IDEA / Lidl — OBAVEZNO, cena se odmah ispiše
   │  2. papir: kuca stavke (Enter → nova), min 1, max 30
   │  3. napomena za Potrčka (opciono, sklopljeno <details>)
   │  4. adresa dostave — postojeći AddressAutocomplete (Places predlozi)
   │  5. sprat/stan (opciono)
   │  6. telefon
   │  klik „Pošalji Potrčka u kupovinu"
   ▼
prepareShoppingQuote() na serveru
   │  ├─ store mora biti jedan od četiri poznata id-ja, inače greška
   │  ├─ cena se izvodi IZ MAPE NA SERVERU, ne iz forme
   │  └─ HMAC potpis nad celom ponudom (lista + cena + adresa)
   │  NIŠTA nije upisano
   ▼
Modal: pregled cele liste + radnja + napomena + adresa + „Dostava: 1000 din"
   │  klik „Potvrdi"
   ▼
createShoppingOrder(token) → RPC create_shopping_order (service_role)
   │  jedna transakcija: orders + shopping_items + offer_order_to_next_courier
   ▼
Telegram kuriru: broj, KUPOVINA, market, cela lista, napomena, adresa, telefon
   │
   ▼
/hvala?broj=P-42&cena=300   (postojeća stranica, bez izmene)
```

Nastavak (kurir prihvati/odbije/isporuči) je **identičan** postojećem — ništa se ne dira.

---

## 4. Data model

### Migracija `supabase/migrations/2026090713xxxx_shopping_orders.sql`

```sql
-- 1. Vrsta porudžbine
create type public.order_type as enum ('dostava', 'kupovina');

alter table public.orders
  add column order_type public.order_type not null default 'dostava',
  add column shopping_note text;

-- 2. Stavke liste
create table public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  sort_order integer not null,
  text       text not null,
  checked    boolean not null default false,
  created_at timestamptz not null default now(),
  constraint shopping_items_text_not_blank check (char_length(trim(text)) > 0),
  unique (order_id, sort_order)
);
create index shopping_items_order_idx on public.shopping_items (order_id, sort_order);

alter table public.shopping_items enable row level security;
create policy shopping_items_owner_select on public.shopping_items
  for select to authenticated using (true);
-- anon: nijedna polisa = nikakav pristup, isto kao orders
```

**ZAŠTO zasebna tabela, a ne `TEXT` kolona:** klijent hoće da kurir kasnije čekira proizvode dok kupuje. Sa tabelom, to je kasnije jedan `UPDATE shopping_items SET checked = true WHERE id = …`. Sa TEXT kolonom, morali bismo da parsiramo tekst ili radimo migraciju sa backfill-om — isti posao dvaput. Tabela nas sada košta jednu migraciju i jedan `insert … select unnest(…)` u istom RPC-u. To je jeftino.

**ZAŠTO `sort_order`, a ne `position`:** `position` je SQL ključna reč (`position(x in y)`). Radi kao ime kolone, ali traži oprez pri pisanju upita — ne vredi rizika.

**ZAŠTO nema `store_preference` kolone:** naziv radnje upisujemo u postojeći `shop` (`"Maxi"`, `"Lidl"`…). Ta kolona već znači „odakle preuzimamo" i **već je prikazuju tabla, Telegram i kurirska stranica**. Nova kolona bi bila drugi izvor istog podatka i tražila izmenu na tri mesta.

### Cenovnik po radnji

Ide u `lib/pricing.ts`, pored postojećih razreda — cena je poslovno pravilo i pripada tamo gde su i ostala:

```ts
/**
 * Kupovina iz marketa ima fiksnu cenu dogovorenu po lancu — kilometraža se
 * ne računa. Lidl je duplo skuplji (dogovor sa klijentom, 07.09.2026).
 *
 * `as const` daje TypeScript-u tačan skup id-jeva, pa ShoppingStore ne može
 * da odluta od ove liste.
 */
export const SHOPPING_STORES = [
  { id: "maxi", label: "Maxi", price: 500, logo: "/prodavnice/maxi.svg" },
  { id: "roda", label: "Roda", price: 500, logo: "/prodavnice/roda.svg" },
  { id: "idea", label: "IDEA", price: 500, logo: "/prodavnice/idea.svg" },
  { id: "lidl", label: "Lidl", price: 1000, logo: "/prodavnice/lidl.svg" },
] as const;

export type ShoppingStore = (typeof SHOPPING_STORES)[number]["id"];

/** Nepoznat id vraća null — forma je mogla biti falsifikovana. */
export function findShoppingStore(id: unknown) {
  return SHOPPING_STORES.find((s) => s.id === id) ?? null;
}
```

**ZAŠTO konstanta u kodu, a ne tabela `stores` u bazi:** cena je poslovno pravilo koje mora biti u gitu — vidi se ko ju je promenio i kada, i putuje zajedno sa deploy-om. Red u tabeli menja se tiho, bez traga u istoriji. Sa četiri lanca bez ijednog dodatnog atributa, tabela bi tražila i admin CRUD da bi imala smisla — a to je posao koji trenutno ništa ne rešava.

**ZAŠTO browser šalje samo `store`, nikad cenu:** ista logika zbog koje je u `supabase/migrations/20260902120000_distance_pricing.sql` anon-u oduzeto pisanje u `orders` — „svako sa interneta bi mogao da naruči dostavu za 0 dinara". Cena koju forma prikazuje je samo prikaz; obavezujuća je ona koju server izvede iz `SHOPPING_STORES` i zapečati HMAC potpisom.

**ZAŠTO `order_type` enum, a ne boolean:** enum se čita u SQL-u (`where order_type = 'kupovina'`), dozvoljava treću vrstu usluge kasnije bez migracije šeme, i poklapa se sa postojećom konvencijom (`order_source`, `order_status` su enumi na srpskom).

**ZAŠTO `default 'dostava'`:** svi postojeći redovi automatski dobiju ispravnu vrednost, bez `UPDATE`-a i bez perioda u kom je kolona `NULL`.

### `title` i `shop` za kupovinu

Server generiše `title` kao **sažetak** — npr. `Kupovina (6): 2x mleko, hleb, 10 jaja…` (skraćeno na 500 znakova). Autoritativna lista je u `shopping_items`; `title` postoji da bi tabla i Telegram imali jednu čitljivu liniju **bez ijedne izmene**.

### Novi RPC `create_shopping_order`

```sql
create function public.create_shopping_order(
  p_title text, p_shop text, p_address text, p_phone text,
  p_delivery_price numeric, p_place_id text,
  p_note text, p_items text[]
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_number text;
begin
  if coalesce(array_length(p_items, 1), 0) not between 1 and 30 then
    raise exception 'shopping list must have 1..30 items';
  end if;

  insert into public.orders (
    title, shop, address, phone, source, order_type,
    delivery_price, destination_place_id, shopping_note
  ) values (
    trim(p_title), trim(p_shop), trim(p_address), trim(p_phone), 'sajt', 'kupovina',
    p_delivery_price, nullif(trim(p_place_id), ''), nullif(trim(p_note), '')
  )
  returning id, public_number into v_id, v_number;

  insert into public.shopping_items (order_id, sort_order, text)
  select v_id, ord, trim(t)
  from unnest(p_items) with ordinality as u(t, ord)
  where char_length(trim(t)) > 0;

  perform public.offer_order_to_next_courier(v_id);
  return v_number;
end;
$$;

revoke all on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]) from public;
revoke execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]) from anon, authenticated;
grant execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]) to service_role;
```

**Dva `revoke`-a, ne jedan** — Supabase preko `ALTER DEFAULT PRIVILEGES` daje `EXECUTE` direktno roli `anon`, pa `revoke … from public` nije dovoljan. Pravilo je već zapisano u `supabase/migrations/20260902130000_lock_pricing_grants.sql`.

**Zašto novi RPC, a ne proširenje `create_web_order`:** menjanje liste parametara ionako traži `drop` + `create` (ne prolazi kroz `create or replace`), pa nema uštede — a jedna funkcija sa devet parametara od kojih pola važi samo ponekad je teža za čitanje i lakša za grešku. Dve male funkcije sa istim oblikom su jasnije.

**Zašto sve u jednoj funkciji:** porudžbina bez stavki ili stavke bez porudžbine su neupotrebljive. PL/pgSQL funkcija je jedna transakcija — ili sve prođe, ili ništa. Isto pravilo koje `owner_delete_courier` već poštuje.

### Izmena `courier_job_json`

Dodati `order_type`, `shopping_note` i `items`. Volatilnost mora sa `immutable` na `stable` (funkcija sada čita drugu tabelu):

```sql
create or replace function public.courier_job_json(o public.orders, p_offered_at timestamptz)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', o.id, 'public_number', o.public_number, 'title', o.title,
    'shop', o.shop, 'address', o.address, 'phone', o.phone,
    'delivery_price', o.delivery_price, 'distance_m', o.distance_m,
    'status', o.status, 'offered_at', p_offered_at,
    'order_type', o.order_type,
    'shopping_note', o.shopping_note,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', si.id, 'text', si.text, 'checked', si.checked)
                       order by si.sort_order)
      from public.shopping_items si where si.order_id = o.id), '[]'::jsonb)
  );
$$;
revoke all on function public.courier_job_json(public.orders, timestamptz) from public;
```

`checked` i `id` idu u JSON već sada iako ih UI ne koristi — kad dođe faza čekiranja, baza je spremna, a `courier_dashboard` se ne dira.

---

## 5. Reuse postojećeg koda

| Ponovo koristimo | Kako |
|---|---|
| `AddressAutocomplete` | bez ijedne izmene — isti `name="address"`, isti HMAC „proof" |
| `app/api/adrese/route.ts` | bez izmene |
| `readPlace` / `validText` / `validPhone` iz `lib/order-quote.ts` | izdvajaju se u `lib/order-validation.ts` i dele ih oba toka |
| `lib/order-signing.ts` | dodaje se samo `"shopping"` u `type Purpose` |
| `confirmOrderQuote` obrazac | isti dvokorak, ista `try/catch` oko `notify` |
| `lib/supabase/admin.ts` | isti service_role klijent |
| `offer_order_to_next_courier` + ceo kurirski tok | **nula izmena** |
| `/hvala` | nula izmena |
| `lib/ui.ts` klase | `fieldClass`, `labelClass`, `primaryButtonClass`, `fieldWithIconClass` |
| `SiteNav`, `HeroWave`, `ContactStrip`, `AnnouncementBar`, `BrandLogo` | `/kupovina` ih sastavlja isto kao `/saradnja` |
| `.hero-surface`, `.hero-title`, `.hero-description` | isti hero recept |
| `components/icons.tsx` | dodajemo `CartIcon`, `TrashIcon`, `PlusIcon` u isti fajl (ručni SVG, bez biblioteke) |

**Namerno NE koristimo ponovo:** `deliveryPriceFromMeters` i `computeDistanceMeters` — kupovina ima fiksnu cenu, Google se ne zove.

---

## 6. Novi fajlovi

```
supabase/migrations/2026090713xxxx_shopping_orders.sql

app/kupovina/page.tsx                       server component, sastavlja stranicu
app/actions/prepare-shopping-order.ts       "use server", tanak omotač
app/actions/create-shopping-order.ts        "use server", tanak omotač

lib/order-validation.ts                     izdvojeni deljeni helperi (iz order-quote.ts)
lib/shopping.ts                             MAX_ITEMS, MAX_ITEM_LEN, normalizeItems(), buildShoppingTitle()
lib/shopping-quote.ts                       prepareShoppingQuote(), confirmShoppingQuote()

components/service-cards.tsx                dve kartice na početnoj
components/modal-shell.tsx                  izdvojena <dialog> mehanika (iz order-confirmation.tsx)
components/shopping/shopping-order-form.tsx orkestrator, po uzoru na guest-order-form
components/shopping/shopping-paper.tsx      papir + upravljanje listom
components/shopping/shopping-row.tsx        jedan editable red
components/shopping/store-picker.tsx        četiri radio kartice sa cenom
components/shopping/shopping-confirmation.tsx  modal pregleda (koristi ModalShell)

docs/featureNamirnice.md                    ovaj dokument — izvor istine za feature
```

### Izmene postojećih fajlova

| Fajl | Izmena |
|---|---|
| `AGENTS.md` | novi odeljak o usluzi kupovine (pravilo projekta: prvo dokument, pa kod) |
| `lib/pricing.ts` | `+ SHOPPING_STORES`, `ShoppingStore`, `findShoppingStore()` |
| `lib/order-signing.ts` | `type Purpose = "place" \| "quote" \| "shopping"` |
| `lib/order-quote.ts` | helperi se sele u `order-validation.ts`, ostalo netaknuto |
| `lib/types.ts` | `+ OrderType`, `ShoppingItem`; `CourierJob` i `BoardOrder` dobijaju `order_type`, `shopping_note`, `items` |
| `lib/courier-message.ts` | `MessageOrder` dobija `order_type`, `items`, `shopping_note`; nova grana teksta |
| `lib/telegram.ts` | `sendOffer` čita `order_type, shopping_note` + dovlači stavke kad je kupovina |
| `components/order-confirmation.tsx` | koristi izdvojeni `ModalShell`, ponašanje isto |
| `components/site-nav.tsx` | `+ link „Kupovina"` |
| `app/page.tsx` | `+ <ServiceCards />` iznad postojeće forme |
| `app/admin/page.tsx` | select `+ order_type, shopping_note, shopping_items(text, sort_order)` |
| `components/admin/order-card.tsx` | prikaz liste i napomene kad je kupovina |
| `components/courier/job-details.tsx` | prikaz liste (read-only) i napomene |

---

## 7. Plan implementacije

Radimo redom, jedna faza po jedna, sa objašnjenjem pre koda. Ne prelazimo dalje dok prethodna faza ne radi.

**Faza 0 — dokumenti** (bez koda)
`docs/featureNamirnice.md` (ovaj fajl) + odeljak u `AGENTS.md`. Pravilo projekta je da dokument ide prvi.

**Faza 1 — baza**
Migracija: `order_type`, `shopping_note`, `shopping_items`, `create_shopping_order`, izmenjen `courier_job_json`. Provera u Supabase SQL Editoru (v. dole).

**Faza 2 — ruta i izbor usluge**
`components/service-cards.tsx`, izmena `app/page.tsx` i `SiteNav`, prazna `/kupovina` sa hero-om i placeholder karticom. Cilj: klik sa početne stigne na novu stranicu.

**Faza 3 — izbor radnje i cenovno polje**
`SHOPPING_STORES` u `lib/pricing.ts` + `store-picker.tsx` (logo + naziv, bez cene) + `price-panel` blok iznad dugmeta koji reaguje na izbor. Malo koda, ali postavlja poslovno pravilo pre svega ostalog. Radi i bez logo fajlova — fallback je naziv.

**Faza 4 — papirna lista**
`shopping-paper.tsx` + `shopping-row.tsx`, čisto klijentsko stanje, bez slanja. Enter/Backspace/↑↓/briši/brojač. Ovde ide sav dizajnerski rad na papiru — najveća faza.

**Faza 4b — donji deo forme**
`<details>` za napomenu, `AddressAutocomplete`, sprat/stan, telefon, sažetak cene iznad dugmeta. I dalje bez slanja.

**Faza 5 — ponuda i upis**
`lib/order-validation.ts` (izdvajanje), `lib/shopping.ts`, `lib/shopping-quote.ts`, dve server akcije, `ModalShell` refactor, `shopping-confirmation.tsx`. Kraj faze: porudžbina se stvarno upisuje i vodi na `/hvala`.

**Faza 6 — kurir i tabla vide listu**
`courier-message.ts`, `telegram.ts`, `order-card.tsx`, `job-details.tsx`, tipovi. Kraj faze: kurir dobije celu listu u Telegramu i na `/k/{token}`.

**Faza 7 — mobilni polish i test**
Papir na 360 px, prelazak fokusa tastaturom, `prefers-reduced-motion`, dugačke stavke koje se prelamaju, 30 stavki u Telegram poruci.

---

## 8. Verifikacija

**Baza (Supabase SQL Editor)** — oba moraju vratiti `permission denied` / 42501:
```sql
set role anon;
select public.create_shopping_order('x','Maxi','x','0600000000', 500, null, null, array['mleko']);
select * from public.shopping_items;
reset role;
```
Zatim, kao `service_role`, jedan pun poziv i provera da su red i stavke tu:
```sql
select o.public_number, o.order_type, o.shop, o.delivery_price, si.sort_order, si.text
from public.orders o join public.shopping_items si on si.order_id = o.id
order by o.created_at desc, si.sort_order limit 20;
```

**Aplikacija (`npm run dev`)**
1. `/` → obe kartice vidljive; klik na drugu vodi na `/kupovina`
2. **Cena:** Maxi/Roda/IDEA → 500 din, Lidl → 1000 din; prebacivanje radnje odmah menja iznos u polju iznad dugmeta i kasnije u modalu
3. **Bez izabrane radnje** cenovno polje stoji prazno („izaberi radnju"), dugme javi grešku i ne zove server
3b. Kartice **ne smeju** nigde prikazivati cenu — samo logo i naziv
4. Papir: Enter pravi nov red i fokusira ga; Backspace na praznom briše; ↑↓ menjaju redosled; 31. stavka se odbija
5. Prazna lista → dugme javi grešku, nema poziva serveru
6. Adresa mora biti izabrana iz predloga (isto ponašanje kao na početnoj)
7. Modal prikaže **celu** listu, radnju i cenu; „Potvrdi" vodi na `/hvala?broj=P-…&cena=…`
8. `/admin` (ulogovan) — kartica pokazuje sažetak, radnju, listu i napomenu

**Bezbednost cene (ručno, DevTools)**
9. U `<form>` promeni vrednost radio dugmeta u nepostojeći id (npr. `"tempo"`) → server mora odbiti sa greškom, ne upisati red
10. Potvrdi da nijedan `<input>` na stranici ne nosi iznos cene — server ga izvodi sam
11. Telegram: kurir dobije poruku sa radnjom, celom listom i napomenom; dugme „Otvori porudžbinu" otvara `/k/{token}` gde je ista lista
12. Kurir prihvati → `krenuo`; isporuči → `isporuceno`. Ceo tok mora raditi isto kao za standardnu dostavu.

**Regresija (obavezno, jer Faza 5 dira `order-quote.ts` i `order-confirmation.tsx`)**
13. Standardna porudžbina sa početne mora proći od kraja do kraja, sa tačnom cenom po kilometraži
14. `node --import ./tests/load-typescript.mjs --test tests/` — postojeći testovi moraju proći

**Mobilni (DevTools 360×640)**
15. Papir pune širine, bez horizontalnog skrola, bez zumiranja pri fokusu polja
16. Četiri kartice radnji staju u `grid-cols-2` bez preklapanja; logotipi ostaju čitljivi na maloj kartici

---

## 9. Otvoreno

- **Logo fajlovi.** Trebaju četiri fajla u `public/prodavnice/` (`maxi.svg`, `roda.svg`, `idea.svg`, `lidl.svg`). Dok ih nema, kartica prikazuje naziv i sve radi. Napomena: logotipi lanaca su zaštićeni žigovi — vredi da klijent potvrdi da sme da ih koristi na svom sajtu (u praksi obično jeste u redu jer označava uslugu koju stvarno pruža, ali odluka je njegova).
- **Lidl je duplo skuplji, a to se sada vidi tek pri dnu stranice.** Poštujem odluku da cena ne stoji na karticama. Ako se u praksi pokaže da ljudi izaberu Lidl, ispišu listu i odustanu kad vide 1000 din — najmanja popravka je jedna diskretna linija ispod kartica koja se pojavi tek posle izbora („Dostava iz Lidla: 1000 din"). Ne radimo sada; vredi pratiti.
- Da li kupac ikad sme da traži radnju van ove četiri (pijaca, apoteka, mesara)? Zasad **ne** — za to postoji standardna dostava na početnoj. Ako se pokaže potreba, dodaje se peta stavka u `SHOPPING_STORES`, bez migracije baze.
- Da li se cena 500/1000 menja po udaljenosti kupca? Zasad **ne** — fiksna je bez obzira na adresu. Vredi pratiti: ako kupac iz sela na 12 km plati isto kao onaj iz centra, klijent gubi na toj vožnji.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Šmrčko Potrčko — kontekst za svaku sesiju

Ovaj fajl je izvor istine. Ako klijent promeni zahtev, **prvo ažuriraj ovaj fajl**, pa tek onda kod.

Ponuda klijentu (PDF) je prodajni dokument. Gde se PDF i ovaj fajl raspolože, **važi ovaj fajl**.

## Cilj učenja (obavezno u svakoj sesiji)

Ovo nije samo klijentski posao. **Veljko uči kroz ovaj projekat** (junior, oko 6 meseci iskustva). Gotov kod bez razumevanja je neuspeh.
## JAKO BITNO 
Objasni mu sta radis, NEMOJ mu davati kod i onda sve objasniti probaj da razume i da on napreduje a ne samo da posao bude uradjen.

Kako agent mora da radi:

- **Prvo ZAŠTO, pa kod.** Problem, šta smo odbacili, zašto baš ovaj alat. Pojmove (npr. Realtime, RLS, deeplink) objasni običnim jezikom pre nego što ih koristiš.
- **Ne radi sve odjednom.** Jedna faza, kratko objasni šta je urađeno i zašto, sačekaj da je jasno, pa sledeća.
- **Ne bacaj gotov zid koda.** Bolje manji diff + objašnjenje nego ceo feature u tišini.
- **Kod se daje u malim celinama, ne ceo fajl odjednom.** Za svaku celinu: prvo kratko objašnjenje (šta i zašto), pa taj deo koda. Sačekaj da je jasno, pa sledeća celina. Veljko prekucava sam — mora da stigne da prati.
- **Ne pretpostavljaj da zna.** Ako nešto „svi znaju“ (env, Auth, token, F5 vs live tabla), reci šta je i čemu služi.
- Srpski u objašnjenjima; imena u kodu na engleskom.

## Proizvod

Služba dostave: kupac naruči **bilo šta** (nije katalog hrane), **sa sajta ili telefonom vlasniku**. Ista porudžbina završi na tabli. Kurira bira **baza automatski** i javlja mu preko **Telegrama**; kurir prihvati ili odbije i označi status. Plaćanje je **uvek keš, van aplikacije, zauvek**.

Ostala dva sajta iz ponude (Food of Šmrk, perionica) **ne radimo**.

## Saradnja — B2B upit

- Javna stranica `/saradnja` namenjena je firmama kojima treba dostava.
- Navigacija na `/` i `/saradnja` ima linkove „Poruči“ i „Saradnja“.
- Navigacija nema logo; linkovi su desno, a logo ostaje u hero sekciji.
- Linkovi navigacije koriste Archivo, 16 px, debljinu 800 radi bolje uočljivosti.
- Navigacija je fiksirana preko hero sekcije: na vrhu providna sa belim slovima, posle 40 px skrola bela sa tamnim slovima i blagom senkom. Hero zadržava punu visinu ekrana i gornji razmak za navigaciju.
- Firma ostavlja naziv firme, telefon i opcionu poruku.
- Upit se šalje vlasniku na mejl preko Resend-a; ne čuva se u bazi.
- Cena i uslovi saradnje dogovaraju se telefonom.
- Nalozi i pristup aplikaciji za firme dodaju se naknadno.
- Katalog partnera i tabela `partners` nisu deo ove izmene.
- Plan izrade: `docs/saradnjaB2B.md`.

## Tech stack

Jedna aplikacija, ne dva frontenda.

- **Next.js (App Router) + TypeScript** — to jeste React; nema odvojenog CRA/Vite projekta
- **Vercel** — hosting sajta
- **Supabase** — Postgres, Auth (samo vlasnik), kasnije Realtime za tablu
- **E-mail vlasniku** — Resend ili ekvivalent (ne Gmail SMTP sa lozinkom u env)
- **Telegram bot** — javlja kuriru novu ponudu. WhatsApp je **izbačen** (ne koristi se)

Env: `.env.local`, nikad na git. Anon ključ sme u klijent; service role **samo** na serveru.

## Ko sme šta

| Uloga   | Nalog              | Šta radi |
|---------|--------------------|----------|
| Kupac   | Nema (gost)        | Forma, vidi hvala + broj |
| Vlasnik | Supabase Auth      | Tabla, unos porudžbine sa poziva, kuriri, dodela, mejl |

Vlasnik **sam pravi svoj nalog** na `/registracija` (skrivena ruta, nema linka sa
sajta). Kapija je tajni kod `OWNER_SIGNUP_CODE` iz env-a; kad se kod obriše, ruta
se sama zatvara. Razlog za kapiju: RLS pravilo je „ulogovan = vlasnik", pa bi
otvorena registracija dala svakome adrese i telefone kupaca.
| Kurir   | PIN + tajni URL    | Telegram ponuda, prihvati/odbij, statusi |

Google login i sačuvane adrese **nisu V1**.

## Porudžbina (tanka)

Polja: **naziv** (šta treba), **radnja** (slobodan tekst, odakle), **adresa** (bira se iz Places predloga), **telefon** (obavezan), **izvor** (`sajt` \| `telefon` — kako je porudžbina ušla), **cena_dostave** (server računa `30 + 80 × km`, naviše na 10 din, pa primenjuje cenovne razrede ispod; `NULL` ako Google zakaže — vlasnik je upiše ručno na tabli), **distance_m** (metri firma → kupac), **destination_place_id** (Google ID adrese), **status**, **javni broj** (npr. P-17), **kurir**, **vreme dodele**, **kurirski token** (dugačak, nije P-17). Kolona **zona** (`grad` \| `van_grada`) ostaje u bazi zbog starih redova, ali se više ne popunjava. Izvor istine za cenu: `docs/featureGoogleMaps.md`.

Nema liste partnera, nema posebnog polja napomena u V1 (može ući u naziv).

### Cenovni razredi dostave (05.09.2026)

Prvo se izračuna osnovica `ceil((30 + 80 × km) / 10) × 10`, pa se jednom preslika u konačnu cenu:

| Zaokružena osnovica | Konačna cena dostave |
|---|---|
| Manje od 50 din | 180 din |
| Od 50 do uključujući 150 din | 200 din |
| Preko 150 do uključujući 220 din | 220 din |
| Preko 220 do uključujući 250 din | 250 din |
| Preko 250 din | 300 din, fiksno i za veće udaljenosti |

Razredi se odnose na obračun dostave, ne na vrednost kupljene robe. U bazu se upisuje konačna cena; ranije upisane porudžbine se ne preračunavaju. Ako kilometraža nedostaje, cena ostaje `NULL` radi ručnog unosa.

### Predlozi adresa u javnoj formi (05.09.2026)

- Oba polja, **„Odakle preuzimamo?”** (`shop`) i **„Gde donosimo?”** (`address`), nude Google Places predloge tokom kucanja.
- Predlozi i tekst izabranih adresa prikazuju se na **srpskoj latinici**.
- Mesto preuzimanja se i dalje čuva kao tekst u `shop`; za sada služi samo izboru adrese. Obračun ostaje firma → kupac, a `place_id` iz forme odnosi se samo na odredište.
- Koristi se zajednička komponenta sa nezavisnim stanjem za svako polje; ručni unos ostaje moguć.

Statusi: `nova` → `poslata_kuriru` → `krenuo` → `isporuceno`.

## Dva ulaza, jedna tabla (važno)

Danas klijent živi od telefona. Sajt **neće** ugasiti pozive. Javni broj vlasnika za kupce: **066 59 355 35** (poziv, WhatsApp, Viber — dno početne). Ako porudžbinu sa poziva ne upišemo u istu aplikaciju, vlasnik opet nema evidenciju — pa sajt nije rešio problem.

Zato postoje **dva ulaza u istu tabelu** `orders`, ne dva sistema:

1. **Sajt** — kupac sam popuni javnu formu (`izvor = sajt`). Dobije hvala + broj. Vlasniku stigne mejl (nije pored ekrana).
2. **Telefon** — kupac zove, kaže šta želi. Vlasnik na tabli otvori **„Nova porudžbina“** i upiše ista polja dok razgovara (`izvor = telefon`). Nema stranice hvala za kupca (već je na vezi). **Mejl vlasniku se ne šalje** — već je na tabli i na telefonu; dupli signal smeta.

Od tog trenutka tok je **isti**: auto-dodela kurira → Telegram ponuda → kurirski link → statusi. Kurir ne mora da zna da li je naručeno sa sajta ili pozivom.

Zašto ne posebna tabela „telefonske“: dupli kod, dupli izveštaji, lako da se zaboravi jedna lista. Jedan red = jedna vožnja, bez obzira kako je stigla.

## Tok V1

**A — kupac na sajtu**

1. Gost kuca formu (nema login).
2. Insert u `orders` (`izvor = sajt`) + broj.
3. Stranica: hvala, **cena dostave** (izračunata iz kilometraže; ako fali — „javljamo pozivom"), pa broj. **Nema** live praćenja za kupca.
4. Mejl vlasniku.

**B — kupac zove vlasnika**

1. Vlasnik (ulogovan) na tabli: Nova porudžbina.
2. Upiše naziv, radnju, adresu (isti Places izbor kao na sajtu), telefon.
3. Insert u `orders` (`izvor = telefon`) + broj. Broj može da pročita kupcu na vezi ako zatreba.
4. Bez mejla, bez javne hvala-stranice.

**Zajednički nastavak (A i B)**

5. Tabla: prvo **ručno osvežavanje (F5)**. Kad to radi, tek onda pretplata na tabelu (Supabase Realtime = tabla sluša insert, ne pita server u krug). Polling ne uvoditi osim ako Realtime zapne.
6. Baza sama izabere slobodnog kurira na smeni (`offer_order_to_next_courier`) i upiše `poslata_kuriru`.
7. Server javi tom kuriru preko **Telegram bota**: tekst porudžbine + dugme ka `/k/{token}`. Kurir prihvati („krenuo") ili odbije — odbijena ide sledećem kuriru.

Auto-dodela ostaje podrazumevana. Vlasnik **sme i ručno** da pošalje porudžbinu
kuriru kog izabere (dugme na kartici) — za slučaj kad su svi zauzeti pa
porudžbina visi, ili kad kurir ćuti na ponudu. Preotima se samo do statusa
`poslata_kuriru`; porudžbinu koju je kurir prihvatio (`krenuo`) ne diramo.
Ručna dodela je obična ponuda: Telegram stiže, kurir sme da odbije.

## Šta nije V1 (ne radi osim ako vlasnik ovog repoa kaže da klijent to sada traži)

- Katalog partnera / proizvodi (kasniji **upsell**: naplata prodavnicama za izlistavanje) — nema tabele `partners` u V1
- Google **login**, Google Maps prikaz na stranici, sačuvane adrese, tracking kupca, CMS cena u UI, zvuk, statistika, radno vreme koje zatvara formu
  - **Kuriri u UI su sada V1** (`/admin/kuriri`): vlasnik dodaje kurira, sam bira
    njegov PIN (4–8 cifara), menja ime/telefon, gasi ga (`is_active`) ili briše,
    i kopira mu `/k/{token}` link. Detalji: `docs/featureAdmin.md`.
  - **Ali:** Google **Routes API** (kilometraža) + **Places Autocomplete** (izbor adrese) za cenu dostave **JESU V1** — vidi `docs/featureGoogleMaps.md`. Ključ samo na serveru.
- Plaćanje online **nikad**
- Food of Šmrk / perionica

## Faze izrade (radi redom)

0. Papirni tok i ko sme da čita čije podatke
1. Skelet Next + Supabase, `/` i `/admin`
2. Tabele `orders`, `couriers` + RLS
3. Forma + hvala + broj
4. Login + tabla sa F5
5. **Unos sa poziva** na tabli (ista polja, `izvor = telefon`, bez mejla)
6. Lista kurira + smena + izbor
7. Auto-dodela kurira + Telegram ponuda (zamenilo `wa.me`)
8. Kurirski link + statusi
9. Mejl vlasniku (samo `izvor = sajt`)
10. Live tabla (Realtime), tek kad 4–8 razumeš
11. Vlasnički deo (`docs/featureAdmin.md`): `/registracija` sa tajnim kodom,
    `/admin/kuriri`, ručna dodela porudžbine kuriru

## Baza i bezbednost (kad dođemo do koda)

- Javni insert porudžbine: da (samo sa sajta, `izvor = sajt`). Insert sa table: samo ulogovan vlasnik (`izvor = telefon`). Javni select svih porudžbina: **ne**.
- Kurir `update` samo preko tokena (RPC ili server), ne „update bilo kog reda“.
- Kupac ne vidi tuđe adrese/telefone.
- Token kurira nije pogodiv (`/k/1` je pogrešno).

## Kako agent radi u ovom repo-u

- Učenje je deo zadatka — vidi odeljak **Cilj učenja**.
- Cena dostave: `30 + 80 × km`, naviše na 10 din, zatim cenovni razredi 180/200/220/250/300 din iz ovog fajla i `docs/featureGoogleMaps.md`. Ne nagađaj spisak kurira ni naselja.
- Kad klijent promeni zahtev: ažuriraj **ovaj fajl**, pa implementiraj.
- Ne širi scope „dok si već tu“ (partneri, Google, zvuk, CSV).
- Posle UI izmene: proveri tok u browseru ako alati postoje.
- Ne commituj osim ako vlasnik koda eksplicitno traži.

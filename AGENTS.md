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
| Kurir   | PIN + tajni URL    | Telegram ponuda, prihvati/odbij, statusi |

Google login i sačuvane adrese **nisu V1**.

## Porudžbina (tanka)

Polja: **naziv** (šta treba), **radnja** (slobodan tekst, odakle), **adresa**, **telefon** (obavezan), **zona** (`grad` \| `van_grada`), **izvor** (`sajt` \| `telefon` — kako je porudžbina ušla), **cena_dostave** (fiksno: **grad 200 din**, **van grada / sela 250 din** — nema CMS-a, dve konstante u kodu; na hvala-stranici se prikaže pre broja), **status**, **javni broj** (npr. P-17), **kurir**, **vreme dodele**, **kurirski token** (dugačak, nije P-17).

Nema liste partnera, nema posebnog polja napomena u V1 (može ući u naziv).

Statusi: `nova` → `poslata_kuriru` → `krenuo` → `isporuceno`.

## Dva ulaza, jedna tabla (važno)

Danas klijent živi od telefona. Sajt **neće** ugasiti pozive. Ako porudžbinu sa poziva ne upišemo u istu aplikaciju, vlasnik opet nema evidenciju — pa sajt nije rešio problem.

Zato postoje **dva ulaza u istu tabelu** `orders`, ne dva sistema:

1. **Sajt** — kupac sam popuni javnu formu (`izvor = sajt`). Dobije hvala + broj. Vlasniku stigne mejl (nije pored ekrana).
2. **Telefon** — kupac zove, kaže šta želi. Vlasnik na tabli otvori **„Nova porudžbina“** i upiše ista polja dok razgovara (`izvor = telefon`). Nema stranice hvala za kupca (već je na vezi). **Mejl vlasniku se ne šalje** — već je na tabli i na telefonu; dupli signal smeta.

Od tog trenutka tok je **isti**: izbor kurira → WhatsApp → kurirski link → statusi. Kurir ne mora da zna da li je naručeno sa sajta ili pozivom.

Zašto ne posebna tabela „telefonske“: dupli kod, dupli izveštaji, lako da se zaboravi jedna lista. Jedan red = jedna vožnja, bez obzira kako je stigla.

## Tok V1

**A — kupac na sajtu**

1. Gost kuca formu (nema login).
2. Insert u `orders` (`izvor = sajt`) + broj.
3. Stranica: hvala, **cena dostave** (200 ili 250 prema zoni), pa broj. **Nema** live praćenja za kupca.
4. Mejl vlasniku.

**B — kupac zove vlasnika**

1. Vlasnik (ulogovan) na tabli: Nova porudžbina.
2. Upiše naziv, radnju, zonu, adresu, telefon.
3. Insert u `orders` (`izvor = telefon`) + broj. Broj može da pročita kupcu na vezi ako zatreba.
4. Bez mejla, bez javne hvala-stranice.

**Zajednički nastavak (A i B)**

5. Tabla: prvo **ručno osvežavanje (F5)**. Kad to radi, tek onda pretplata na tabelu (Supabase Realtime = tabla sluša insert, ne pita server u krug). Polling ne uvoditi osim ako Realtime zapne.
6. Baza sama izabere slobodnog kurira na smeni (`offer_order_to_next_courier`) i upiše `poslata_kuriru`.
7. Server javi tom kuriru preko **Telegram bota**: tekst porudžbine + dugme ka `/k/{token}`. Kurir prihvati („krenuo") ili odbije — odbijena ide sledećem kuriru.

Vlasnik na tabli **gleda** i sme da ispravi; ne bira kurira ručno.

## Šta nije V1 (ne radi osim ako vlasnik ovog repoa kaže da klijent to sada traži)

- Katalog partnera / proizvodi (kasniji **upsell**: naplata prodavnicama za izlistavanje) — nema tabele `partners` u V1
- Google, tracking kupca, CMS cena u UI, CRUD kurira u UI (kurire za sad u bazu), zvuk, statistika, radno vreme koje zatvara formu
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

## Baza i bezbednost (kad dođemo do koda)

- Javni insert porudžbine: da (samo sa sajta, `izvor = sajt`). Insert sa table: samo ulogovan vlasnik (`izvor = telefon`). Javni select svih porudžbina: **ne**.
- Kurir `update` samo preko tokena (RPC ili server), ne „update bilo kog reda“.
- Kupac ne vidi tuđe adrese/telefone.
- Token kurira nije pogodiv (`/k/1` je pogrešno).

## Kako agent radi u ovom repo-u

- Učenje je deo zadatka — vidi odeljak **Cilj učenja**.
- Cene dostave su dogovorene (200 / 250). Ne nagađaj spisak kurira ni naselja.
- Kad klijent promeni zahtev: ažuriraj **ovaj fajl**, pa implementiraj.
- Ne širi scope „dok si već tu“ (partneri, Google, zvuk, CSV).
- Posle UI izmene: proveri tok u browseru ako alati postoje.
- Ne commituj osim ako vlasnik koda eksplicitno traži.

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

Druga usluga: **kupovina iz marketa** (`/kupovina`) — lista stavki, fiksna cena po lancu. Detalji: odeljak **Kupovina** i `docs/featureNamirnice.md`.

Ostala dva sajta iz ponude (Food of Šmrk, perionica) **ne radimo**.

## Izgled hero sekcije

- Početna, `/saradnja`, `/kupovina` i `/cena` koriste zajednički završetak hero sekcije u obliku jasno vidljive pocepane ivice papira, bez dijagonale i linija brzine.
- Ivica kombinuje veće nepravilne useke i sitnije neravnine, sa tankim svetlim slojem koji naglašava cepanje. Telefon ima jednostavniji crtež sa krupnim detaljima. Dekoracija je statična i povezuje hero sa izgledom porudžbenice.
- Crvena pozadina i pocepana ivica su iste na sve četiri strane. Sadržaj i animacije hero-a su isti na početnoj i `/saradnja`; `/kupovina` i `/cena` imaju svoj raspored (vidi odeljke **Kupovina** i **Kalkulator cene**).

## O nama (početna)

- Sekcija `#o-nama` na početnoj, između forme (`#poruci`) i kontakt trake.
- Ističe da je Šmrčko Potrčko **lokalni brend iz Jagodine**, ne lanac iz drugog grada.
- Jedna kompozicija (naslov + kratak tekst + tri tačke), bez marketing kartica.
- Crna (`ink`) podloga, bela tipografija, crveni naglasak — isti jezik kao traka obećanja ispod forme.

## Saradnja — B2B upit

- Javna stranica `/saradnja` namenjena je firmama kojima treba dostava.
- Navigacija na `/` , `/kupovina`, `/cena` i `/saradnja` ima linkove „Poruči“, „Kupovina“, „Cena“ i „Saradnja“. Uz „Saradnja” stoji sitnije „(za privatna lica)”.
- Navigacija na `/saradnja`, `/kupovina` i `/cena` prikazuje `BrandLogo` levo, kao link ka `/`; linkovi ostaju desno. Stranice koriste isti centrirani kontejner `max-w-6xl` sa `px-4`, bez razvlačenja navigacije preko celog ekrana. Na početnoj nema logotipa u navigaciji, logo ostaje u hero sekciji.
- Linkovi navigacije koriste Archivo, 16 px, debljinu 800 radi bolje uočljivosti.
- Navigacija je fiksirana preko hero sekcije: na vrhu providna sa belim slovima, posle 40 px skrola bela sa tamnim slovima i blagom senkom. Hero zadržava punu visinu ekrana i gornji razmak za navigaciju.
- Javne stranice imaju fiksno belo kružno dugme sa crvenim okvirom u donjem levom uglu: beli/crveni telefon, `tel:` ka `DISPLAY_PHONE`. Ostaje vidljivo tokom skrola i nestaje kad `<footer>` uđe u ekran. Nema ga na `/admin`, `/prijava`, `/k/…`.
- Firma ostavlja naziv firme, telefon i opcionu poruku.
- Upit se šalje vlasniku na mejl preko Resend-a; ne čuva se u bazi.
- Primalac upita za saradnju je `potrckosmrcko@gmail.com`, podešen preko `PARTNERSHIP_EMAIL_TO`.
- Slanje za saradnju koristi serverski `fetch` i `RESEND_API_KEY`, `EMAIL_FROM`, `PARTNERSHIP_EMAIL_TO`. Bez konfiguracije ili uspešnog odgovora Resend-a prikazuje se greška, i lokalno; unos ostaje sačuvan. Tokom slanja dugme je zaključano, a uspeh se prikazuje u formi. Ova faza ne uključuje mejlove za porudžbine.
- Za početni Resend test pošiljalac podrazumevano koristi `Šmrčko Potrčko <onboarding@resend.dev>`. Agent priprema lokalnu konfiguraciju; vlasnik unosi samo API ključ nakon što jednom navede adresu svog Resend naloga za primaoca. Adresa primaoca se ne može izvesti iz API ključa i ne nagađa se.
- Hero na `/saradnja` govori firmama: dostava za pravna lica u Jagodini i okolini, danas-za-odmah / danas-za-danas ili ugovor, dugoročna saradnja, poziv na `DISPLAY_PHONE`. B2B tekst koristi persiranje velikim slovom (`Vam`, `Vaše`). Nije katalog pekara/restorana.
- Cena i uslovi saradnje dogovaraju se telefonom.
- Nalozi i pristup aplikaciji za firme dodaju se naknadno.
- Katalog partnera i tabela `partners` nisu deo ove izmene.
- Plan izrade: `docs/saradnjaB2B.md`.

## Kupovina — Potrčko ide u kupovinu

Druga usluga pored klasične dostave: kurir **ode u market i kupi** sa liste, ne preuzima gotov paket.

- Javna ruta `/kupovina` + dve kartice na početnoj („Donesi mi nešto” / „Potrčko ide u kupovinu”).
- Navigacija ima link „Kupovina”; na `/kupovina` (kao na `/saradnja`) stoji `BrandLogo` levo.
- Hero `/kupovina` je u dve kolone: levo kosi naslov „POTRČKO IDE U KUPOVINU”, podnaslov „Ti napiši listu, mi donosimo.” i dugme „Napravi listu” koje skroluje na formu (`#kupovina-forma`); desno statična ilustracija bloka „Moja lista” (papir sa krpicom i primerima: Imlek Moja kravica mleko 1.5 l, Persil prašak, Coca cola zero 1l, Chipsy čips). Ilustracija je kodirana HTML/CSS + mali inline SVG, bez slikovnih fajlova; na telefonu ide ispod teksta. Crvena pozadina i pocepana ivica ostaju.
- Ukrasi oko `ShoppingListArt` prate referencu: tanka, bledoružičasta ručno crtana kolica levo i nakrivljena kesa sa zelenilom, flašom i bagetom desno; diskretne crtice oko papira. Oba crteža su potpuno vidljiva izvan papira, sa malim razmakom; na telefonu se smanjuju uz rezervisan prostor sa strane. SVG bez ispune, sa zaobljenim potezima i providnošću na celom crtežu.
- Logotipi lanaca stoje u `public/prodavnice/` (`maxi.jpg`, `roda.jpg`, `idea.jpg`, `lidl.webp`); putanje su u `SHOPPING_STORES` (`lib/pricing.ts`). `StorePicker` na grešku učitavanja pada na tekstualni naziv.
- Dugme za slanje liste je zaključano dok sva obavezna polja nisu popunjena: izabran lanac, bar jedna stavka na listi, adresa izabrana iz predloga, telefon. Dugme prosto ne reaguje dok forma nije kompletna — ne otvara popup da bi reklo šta fali.
- Prikaz cene (u formi i u popup potvrdi) pokazuje samo naslov „Cena dostave”, iznos i naziv lanca. Bez „plaćanje keš” i drugih napomena o plaćanju.
- Obavezan izbor lanca: **Maxi / Roda / IDEA = 500 din**, **Lidl = 1000 din**. Cena je fiksna po lancu — **nema** Google Routes / kilometraže.
- Browser šalje samo `store` id; server cenu izvodi iz `SHOPPING_STORES` u `lib/pricing.ts` i potpisuje HMAC-om (`purpose: "shopping"`).
- Lista stavki (1–30 × max 120 znakova) u tabeli `shopping_items`; `orders.order_type = 'kupovina'`, opciona `shopping_note`.
- `title` = sažetak liste, `shop` = naziv lanca — da tabla, Telegram i `/k/{token}` rade bez posebnog UI-ja dok se lista ne doda.
- Upis samo preko RPC `create_shopping_order` (`service_role`), ista auto-dodela i Telegram.
- Telefonski unos kupovine na tabli i čekiranje stavki kod kurira **nisu** sada.
- Plan izrade: `docs/featureNamirnice.md`.

## Kalkulator cene

Javna stranica `/cena` (tab „Cena”) da kupac vidi cenu **pre** porudžbine, bez telefona i bez upisa u bazu. Besplatna Google kvota (10.000 Places + 10.000 Routes mesečno) to pokriva — kalkulator samo troši iste SKU-ove kao forma.

- Hero: naslov „Izračunaj cenu dostave”, podnaslov „Piši odakle i dokle. Cena je ista kao kad poručiš.”, dugme skroluje na formu (`#cena-forma`). Crvena pozadina i pocepana ivica kao na ostalim javnim stranama. Na `/cena` stoji `BrandLogo` levo. Iznad polja nema dodatnog naslova ni uvoda.
- Samo dva polja: **„Odakle preuzimamo?”** i **„Gde donosimo?”**, isti Places izbor kao na početnoj. Dugme „Izračunaj cenu” je zaključano dok oba predloga nisu izabrana.
- Server proverava oba potpisana predloga, pa zove isti `computeDistanceMeters` (firma → odredište) i istu `deliveryPriceFromMeters`. Polje „odakle” ne menja kilometražu — kao na porudžbini. Nema HMAC ponude, nema popup-a, nema upisa, nema mejla ni Telegrama.
- Prikaz: samo „Cena dostave”, iznos, i dve izabrane adrese. Bez napomena o plaćanju. „Poruči ovu dostavu” vodi na `/#poruci` i unapred popuni ista dva Places izbora (sessionStorage u ovom tabu). Kupovina (`/kupovina`) ovde nije — tamo je fiksna cena po lancu.
- Google greška: unos ostaje, ponovni pokušaj ili poziv `DISPLAY_PHONE`.

## SEO i pronalaženje biznisa (15.09.2026)

- Optimizacija javnih `/`, `/kupovina`, `/cena` i `/saradnja` koristi postojeće tekstove i potvrđene podatke: Šmrčko Potrčko, Jagodina i do 30 km oko grada, javni telefon, radno vreme i društvene mreže.
- Svaka javna strana ima zaseban naslov, opis, canonical URL (glavna adresa stranice) i Open Graph/Twitter prikaz za deljenje. `sitemap.xml` navodi samo ove četiri strane; `robots.txt` omogućava čitanje javnog sadržaja pretraživačima i AI pretrazi.
- `/admin`, `/prijava`, `/k`, `/hvala`, `/registracija` i API odgovori nisu za indeksiranje. SEO oznake ne zamenjuju postojeću autentifikaciju. Preview okruženje se ne indeksira.
- Strukturirani podaci opisuju organizaciju, područje usluge, kontakt i usluge. Ne izmišljati javnu poslovnicu, ocene, recenzije ili partnerstva sa marketima. Interna polazna adresa za obračun nije automatski javna poslovnica.
- Potvrđen glavni domen je **https://smrckopotrcko.rs**. SEO adrese koriste `SITE_URL` (opciona izmena glavnog domena), sa ovim domenom kao podrazumevanim. `NEXT_PUBLIC_SITE_URL` i dalje služi operativnim linkovima; lokalna ili Vercel adresa iz njega ne menja javni SEO domen.
- Poboljšati čitljivost lokalnih podataka i otkrivene probleme učitavanja bez promene toka poručivanja. Ne dodavati sadržaj samo za robote ni gomilati ključne reči.
- Proverom su obuhvaćeni mobilni prikaz, kontrast sitnog teksta, semantičke oblasti stranice i brendirana ikonica. Sitni crveni natpisi i donja traka koriste tamnocrvenu varijantu zbog kontrasta; osnovna hero pozadina ostaje zajednička.
- Google Search Console, Bing Webmaster Tools i Google Business Profile zahtevaju pristup/verifikaciju vlasnika. Uputstvo i preostali koraci su u `docs/seo.md`. Nema garancije indeksiranja, pozicije ili AI preporuke.

## Lokacija — novi zahtev klijenta (29.09.2026)

- Dodati javnu stranicu `/lokacija` sa ugrađenom Google mapom, nazivom biznisa, opisom i radnim vremenom.
- Podatke na stranici i u strukturiranom zapisu uskladiti sa potvrđenim Google Business Profile profilom (ranije Google My Business).
- Klijent traži Schema.org `LocalBusiness` zapis. Pre implementacije potvrditi tačan Google Maps profil i da li postoji javna poslovnica koja prima kupce ili je u pitanju samo dostava na području usluge.
- Veljko je prosledio https://maps.app.goo.gl/ChcMGeUF6qa1bBF27. Proverom preusmerenja 29.09.2026 link vodi na Google Maps lokaciju **Autoperionica SMRK**, a ne na profil sa nazivom Šmrčko Potrčko. Veljko je potvrdio da dostava koristi istu adresu. Mapa može prikazati tu zajedničku lokaciju uz jasno objašnjenje da Google oznaka glasi Autoperionica SMRK.
- Zajednička adresa ne znači isti biznis: naziv, opis, telefon i radno vreme ostaju podaci Šmrčka Potrčka. Profil perionice ne dodavati kao `sameAs` identitet dostave; time se ne može tvrditi da je Google profil dostave usklađen.
- Veljko je potvrdio javnu adresu **Kneza Miloša 24, Jagodina**. Nije potvrđeno da dostava tu prima kupce, pa tekst stranice navodi lokaciju bez poziva „Posetite nas” ili tvrdnje o prijemu kupaca. Ne koristiti internu polaznu adresu obračuna kao zamenu za ovu potvrđenu adresu.
- Ako profil ima skrivenu adresu, ne objavljivati je kroz mapu ili strukturirane podatke. Izbor prikaza mape i primenu `LocalBusiness` uskladiti sa potvrđenim načinom rada; ne izmišljati adresu radi Google validacije.
- Postojeće podatke (Šmrčko Potrčko, 066 59 355 35, svaki dan 08:00–23:00) uporediti sa profilom; eventualne razlike razjasniti sa vlasnikom.
- `/lokacija` koristi zajedničku crvenu hero pozadinu i pocepanu ivicu, `BrandLogo` u navigaciji, kontakt sekciju i donju traku. Hero ima naslov „Tu smo, u Jagodini.” i dugme koje vodi na mapu. Ispod su podaci dostave i ugrađena Google mapa: dve kolone na računaru, jedna na telefonu.
- Mapa koristi javni Google embed bez serverskog Places/Routes ključa, ima pristupačan naslov, odloženo učitavanje i zaseban link za Google Maps. Uz mapu piše da je zajednička lokacija označena kao Autoperionica SMRK.
- Nova stranica ulazi u javnu navigaciju i SEO obuhvat, uključujući sitemap. Na telefonu dugme „Meni” otvara pet linkova ispod zaglavlja; na računaru ostaju u jednom redu. Prethodni SEO odeljak opisuje prvobitne četiri strane.
- Izmene sajta ne ažuriraju automatski Google profil. Implementacija ide u malim celinama uz objašnjenja Veljku.
- Schema (30.09.2026): na Veljkov zahtev postojeći zapis firme koristi `LocalBusiness` i `PostalAddress` iz `BUSINESS_ADDRESS`, uz isti `@id`. Koristi se potvrđena javna adresa; ne tvrdi se da tu postoji prijem kupaca. Zajednički `OpeningHoursSpecification` opisuje radno vreme biznisa i dostupnost kontakta, svakog dana 08:00–23:00. Komponenta se uključuje i na `/lokacija`; za tu stranicu se ne pravi izmišljena usluga nazvana „Lokacija”. Zapis proveriti u lokalnom HTML-u, a posle objave i Google Rich Results Test alatom.

## Tech stack

Jedna aplikacija, ne dva frontenda.

- **Next.js (App Router) + TypeScript** — to jeste React; nema odvojenog CRA/Vite projekta
- **Vercel** — hosting sajta
- **Supabase** — Postgres, Auth (samo vlasnik), kasnije Realtime za tablu
- **E-mail vlasniku** — Resend ili ekvivalent (ne Gmail SMTP sa lozinkom u env)
- **Telegram bot** — javlja kuriru novu ponudu. WhatsApp je **izbačen** (ne koristi se)

Env: `.env.local`, nikad na git. Anon ključ sme u klijent; service role **samo** na serveru.

Javni broj: **066 59 355 35**. Radno vreme **08:00–23:00** (svaki dan) stoji u kontakt traci ispod broja i u crvenoj traci na dnu. Forma se **ne** zatvara van termina. Ispod Pozovi / WhatsApp / Viber stoje linkovi ka [Facebook](https://www.facebook.com/p/Potrcko-Smrcko-61555618102564/) i [Instagram](https://www.instagram.com/smrckopotrcko/).

## Ko sme šta

| Uloga   | Nalog              | Šta radi |
|---------|--------------------|----------|
| Kupac   | Nema (gost)        | Forma, vidi hvala + broj |
| Vlasnik | Supabase Auth      | Tabla, unos porudžbine sa poziva, kuriri, dodela, mejl |

Vlasničke naloge **ručno pravi Veljko kroz Supabase Authentication → Users**.
Samostalna registracija je uklonjena: `/registracija` vraća 404, aplikacija nema
akciju za pravljenje naloga i `OWNER_SIGNUP_CODE` se više ne koristi. Na početnoj
nema linka „Tabla vlasnika”, a na `/prijava` nema „Nemaš nalog? Napravi ga”.
U Supabase Auth podešavanjima mora biti isključeno „Allow new users to sign up”
(i anonimna prijava), jer RLS pravilo ostaje „ulogovan = vlasnik”.
`/prijava` ostaje ulaz za postojeće naloge; skrivenost URL-a nije zaštita od
pogađanja lozinki. Prijava ne otkriva da li nalog postoji, a prekoračenje Supabase
ograničenja pokušaja prikazuje poruku da se sačeka. CAPTCHA/MFA nisu još uvedeni.
| Kurir   | PIN + tajni URL    | Telegram ponuda, prihvati/odbij, statusi |

Google login i sačuvane adrese **nisu V1**.

## Porudžbina (tanka)

Polja: **naziv** (šta treba), **radnja** (na sajtu izbor Places predloga, čuva se kao tekst), **adresa** (bira se iz Places predloga), **telefon** (obavezan), **izvor** (`sajt` \| `telefon` — kako je porudžbina ušla), **cena_dostave** (server računa `start + 80 × km` po razredima ispod; javna porudžbina ne prolazi bez cene, stari `NULL` redovi ostaju za ručni unos), **distance_m** (metri firma → kupac), **destination_place_id** (Google ID adrese), **status**, **javni broj** (npr. P-17), **kurir**, **vreme dodele**, **kurirski token** (dugačak, nije P-17). Kolona **zona** (`grad` \| `van_grada`) ostaje u bazi zbog starih redova, ali se više ne popunjava. Izvor istine za cenu: `docs/featureGoogleMaps.md`.

Nema liste partnera. Opciono polje **napomena za Potrčka** (do 500 znakova) stoji na javnoj formi, unosu sa table i kupovini; čuva se u `shopping_note` i ide kuriru (Telegram, `/k/{token}`, tabla).

### Cena dostave (12.09.2026)

Svaka dostava je **start + (80 × km)**. Start zavisi samo od razdaljine firma → kupac, ne od robe. Nema više fiksnog dodatka od 30 din ni plafona od 300 din.

| Razdaljina | Start |
|---|---|
| Ispod 5 km | 100 din |
| Od 5 km do ispod 10 km | 200 din |
| Od 10 km do uključujući 15 km | 300 din |
| Preko 15 km | 400 din |

Primeri: 1,6 km → 100 + 128 = 228 din; 5 km → 200 + 400 = 600 din; 10 km → 300 + 800 = 1100 din; 16 km → 400 + 1280 = 1680 din. Iznos se zaokružuje na najbliži dinar. Kupovina iz marketa (`/kupovina`) ostaje fiksna po lancu, bez kilometraže. U bazu se upisuje konačna cena; ranije upisane porudžbine se ne preračunavaju. Javna forma ne šalje porudžbinu ako kilometraža ili cena nedostaju. Ručni unos cene ostaje za stare redove sa `NULL`.

### Predlozi adresa u javnoj formi (05.09.2026)

- Oba polja, **„Odakle preuzimamo?”** (`shop`) i **„Gde donosimo?”** (`address`), nude Google Places predloge tokom kucanja.
- Predlozi i tekst izabranih adresa prikazuju se na **srpskoj latinici**.
- Mesto preuzimanja se i dalje čuva kao tekst u `shop`; za sada služi samo izboru adrese. Obračun ostaje firma → kupac, a `place_id` iz forme odnosi se samo na odredište.
- Koristi se zajednička komponenta sa nezavisnim stanjem za svako polje; u javnoj formi oba izbora su obavezna. Promena teksta poništava izbor. Izbor radi klikom i tastaturom.

### Cena i potvrda javne porudžbine (07.09.2026)

- Dugme „Poruči” na početnoj je onemogućeno dok nisu popunjeni opis i telefon i izabrana oba Google predloga (preuzimanje i odredište), isto kao kod kupovine. Samo razmaci ne računaju se kao unos; promena teksta adrese poništava izbor i ponovo zaključava dugme. Nepotpuna forma ne pokreće obračun ni popup, ni klikom ni Enterom. „Ulaz, sprat, stan” ostaje opciono.
- „Poruči” proverava formu i računa cenu, bez upisa i obaveštenja. Popup prikazuje cenu, opis, obe adrese i telefon. U delu za cenu stoje samo „Cena dostave” i iznos, bez napomena o robi i plaćanju.
- Tek „Potvrdi porudžbinu” upisuje red, pokreće postojeću dodelu/Telegram i animaciju, pa vodi na `/hvala` sa brojem i istom cenom.
- „Ulaz, sprat, stan” je opciono polje do 150 znakova; server ga dopisuje postojećoj adresi. Nema nove kolone.
- Server potpisuje Google ID i tekst svakog predloga, pa proverava oba izbora. Potpisana ponuda vezuje proverene podatke, cenu, kilometražu i rok od 15 minuta; potvrda ne zove ponovo Google. Koristi se HMAC-SHA256 i serverski `ORDER_SIGNING_SECRET`.
- Bez uspešnog obračuna nema slanja: sačuvaj unos, ponudi ponovni pokušaj i poziv 066 59 355 35. Istekla ponuda traži novi obračun i novu potvrdu.
- Popup se zatvara dugmetom „Izmeni podatke”, Escape-om ili klikom na pozadinu; unos ostaje, prethodna ponuda se poništava. Tokom obračuna unos je zaključan, tokom potvrde i zatvaranje i dupli klikovi su blokirani.
- Samo javna forma; nema novih tabela, statusa, geografskih ograničenja ni promene cenovnika.
- Jednokratna ponuda (30.09.2026): svaka potpisana ponuda (dostava, kupovina, unos sa poziva) nosi nasumičan `id`, koji upis čuva u `orders.quote_id` (`unique`). Ponovljena potvrda iste ponude ne pravi novu porudžbinu ni novi Telegram; vraća isti broj. Provera je u bazi, ne u aplikaciji, da dva istovremena zahteva ne prođu oba.

Statusi: `nova` → `poslata_kuriru` → `krenuo` → `isporuceno`.

## Dva ulaza, jedna tabla (važno)

Danas klijent živi od telefona. Sajt **neće** ugasiti pozive. Javni broj vlasnika za kupce: **066 59 355 35** (poziv, WhatsApp, Viber — dno početne). Ako porudžbinu sa poziva ne upišemo u istu aplikaciju, vlasnik opet nema evidenciju — pa sajt nije rešio problem.

Zato postoje **dva ulaza u istu tabelu** `orders`, ne dva sistema:

1. **Sajt** — kupac sam popuni javnu formu (`izvor = sajt`). Dobije hvala + broj. Vlasniku stigne mejl (nije pored ekrana).
2. **Telefon** — kupac zove, kaže šta želi. Vlasnik na tabli otvori **„Unesi porudžbinu“** (`/admin/nova`) i upiše ista polja dok razgovara (`izvor = telefon`). Nema stranice hvala za kupca (već je na vezi). **Mejl vlasniku se ne šalje** — već je na tabli i na telefonu; dupli signal smeta.

Od tog trenutka tok je **isti**: auto-dodela kurira → Telegram ponuda → kurirski link → statusi. Kurir ne mora da zna da li je naručeno sa sajta ili pozivom.

Zašto ne posebna tabela „telefonske“: dupli kod, dupli izveštaji, lako da se zaboravi jedna lista. Jedan red = jedna vožnja, bez obzira kako je stigla.

## Tok V1

**A — kupac na sajtu**

1. Gost popuni formu, izabere oba Google predloga i klikne „Poruči”. Server računa cenu bez upisa; popup prikazuje pregled.
2. „Potvrdi porudžbinu” proverava potpisanu ponudu i upisuje `orders` (`izvor = sajt`) + broj.
3. Stranica: hvala, ista **cena dostave**, pa broj. Bez obračunate cene nema nove javne porudžbine. **Nema** live praćenja za kupca.
4. Mejl vlasniku.

**B — kupac zove vlasnika**

1. Vlasnik (ulogovan) otvori **Unesi porudžbinu** (`/admin/nova`).
2. Upiše naziv, radnju, adresu (isti Places izbor kao na sajtu), telefon kupca. Server računa cenu; vlasnik vidi pregled pa potvrdi.
3. Insert u `orders` (`izvor = telefon`) + broj. Broj može da pročita kupcu na vezi ako zatreba.
4. Bez mejla, bez javne hvala-stranice. Ostaje na `/admin/nova` sa brojem, pa može odmah sledeći poziv.

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
- Google **login**, sačuvane adrese, tracking kupca, CMS cena u UI, zvuk, statistika, radno vreme koje zatvara formu
  - Google Maps prikaz je sada tražen za `/lokacija`; vidi odeljak **Lokacija**.
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
5. **Unos sa poziva** na tabli (`/admin/nova`, ista polja, `izvor = telefon`, bez mejla)
6. Lista kurira + smena + izbor
7. Auto-dodela kurira + Telegram ponuda (zamenilo `wa.me`)
8. Kurirski link + statusi
9. Mejl vlasniku (samo `izvor = sajt`)
10. Live tabla (Realtime), tek kad 4–8 razumeš
11. Vlasnički deo (`docs/featureAdmin.md`): ručno pravljenje naloga u Supabase-u,
    `/admin/kuriri`, ručna dodela porudžbine kuriru

## Baza i bezbednost (kad dođemo do koda)

- Vlasnik može trajno da obriše kurira i sa aktivnom ponudom ili vožnjom. Njegove nezavršene porudžbine vraćaju se u `nova`, uz `courier_id = NULL` i `assigned_at = NULL`, za ponovnu dodelu sa table. Isporučene porudžbine ostaju isporučene, bez veze sa obrisanim kurirom. Brisanje i vraćanje porudžbina moraju biti jedna transakcija.

- Javni insert porudžbine: da (samo sa sajta, `izvor = sajt`). Insert sa table: samo ulogovan vlasnik (`izvor = telefon`). Javni select svih porudžbina: **ne**.
- Kurir `update` samo preko tokena (RPC ili server), ne „update bilo kog reda“.
- Kupac ne vidi tuđe adrese/telefone.
- Token kurira nije pogodiv (`/k/1` je pogrešno).

## Reel reklama (30.09.2026)

- Zaseban reklamni video u `artifacts/smrcko-reel`; ne menja tokove na sajtu.
- Kraća verzija traje **11 sekundi**: uvod 2 s, dostava 2 s, kupovina 2 s, provera cene 1 s, saradnja 2 s, kontakt 2 s.
- Na Veljkov zahtev dodati zvučne efekte usklađene sa prelazima i pokretima, kao i izraženije animacije ilustracija. Ovo se odnosi na reklamu, ne na zvuk u aplikaciji.
- Za verziju sa muzikom Veljko je izabrao **Sonican — Upbeat Ukulele Loop - Positive Ads** sa Pixabay-a (numera `268489`). Koristiti 11-sekundni isečak tiho ispod efekata, uz blago utišavanje na kraju; sačuvati izvor i podatke o licenci uz izvozni fajl. Verzija samo sa efektima ostaje sačuvana.
- Sačuvati prvu verziju od 30 sekundi. Nova verzija ostaje vertikalna 1080 × 1920, sa originalnim logotipom, postojećim bojama i istinitim opisom usluga. Završni telefon i domen ostaju mirni radi čitljivosti.

## Kako agent radi u ovom repo-u

- Učenje je deo zadatka — vidi odeljak **Cilj učenja**.
- Cena dostave: `start + 80 × km` (start 100/200/300/400 po razdaljini) iz ovog fajla i `docs/featureGoogleMaps.md`. Kupovina ostaje fiksna po lancu. Ne nagađaj spisak kurira ni naselja.
- Kad klijent promeni zahtev: ažuriraj **ovaj fajl**, pa implementiraj.
- Ne širi scope „dok si već tu“ (partneri, Google, zvuk, CSV).
- Posle UI izmene: proveri tok u browseru ako alati postoje.
- Ne commituj osim ako vlasnik koda eksplicitno traži.

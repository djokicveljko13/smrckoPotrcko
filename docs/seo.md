# SEO — Šmrčko Potrčko

## Šta je urađeno

Glavni domen je **https://smrckopotrcko.rs** (potvrdio Veljko 15.09.2026).
Izmene su u kodu; postaju javne tek kada se ova verzija objavi na Vercelu.

| Deo | Čemu služi | Izvor u kodu |
| --- | --- | --- |
| Naslov i opis svake javne strane | Objašnjavaju uslugu i lokaciju; Google može prikazati drugačiji tekst | `lib/seo.ts` |
| Canonical | Kaže koja je glavna adresa te stranice | `lib/seo.ts` |
| Sitemap | Spisak četiri javne stranice za otkrivanje | `app/sitemap.ts` |
| Robots | Dozvoljava čitanje javnog sadržaja Google-u, Bing-u i AI pretraživačima koji poštuju ovaj standard | `app/robots.ts` |
| Noindex | Prijava, tabla, kurirski linkovi, potvrde, API i preview nisu za rezultate pretrage | `app/layout.tsx`, `next.config.ts` |
| Strukturirani podaci | Mašinski čitljiv naziv firme, kontakt, radno vreme, područje i usluge | `components/structured-data.tsx` |
| Deljenje linka | Open Graph i Twitter naslov, opis i slika sa postojećim logotipom | `app/opengraph-image.tsx` |
| Ikonica | Uklonjena početna Vercel ikonica; `/favicon.ico` preusmerava na postojeću brendiranu `/icon` | `app/icon.tsx`, `next.config.ts` |
| Učitavanje | Promenljive debljine fontova, bez ranog učitavanja rukopisnog fonta, precizne veličine logotipa | `app/layout.tsx`, `components/brand-logo.tsx` |
| Čitljivost | Lokalni opis u postojećem sadržaju, tamniji sitni natpisi, označena navigacija i oblasti stranice | javne stranice i zajedničke komponente |

### Zašto Organization, a ne izmišljena javna poslovnica

Koristimo Schema.org `Organization`, `Service`, `WebSite`, `WebPage` i
`BreadcrumbList`. Nismo dobili potvrdu da firma prima kupce na fizičkoj adresi.
Adresa u obračunu kilometraže nije automatski javna poslovnica. Zato ne
objavljujemo adresu/koordinate iz obračuna kao poslovnicu i ne obećavamo
Google LocalBusiness prošireni prikaz. Ne unosimo izmišljene recenzije,
ocene, partnerstva sa marketima ili cene koje nisu vidljive na stranici.

Podaci dolaze iz postojećih tekstova i `lib/contact.ts`. Kada se promeni radno
vreme ili broj, menja se na jednom mestu. SEO opise proveriti kada se menja ponuda.

### Zašto privatne HTML strane nisu zabranjene u robots.txt

Robot mora moći da pročita `noindex` da bi znao da stranicu treba izostaviti iz
rezultata. `Disallow` sam po sebi ne garantuje uklanjanje URL-a iz pretrage.
Privatne stranice zato imaju i meta oznaku i HTTP zaglavlje `X-Robots-Tag`.
API je izuzet iz obilaska. U sitemap-u nema tokena, porudžbina ni privatnih ruta.
Autentifikacija i provera kurirskog tokena i dalje štite podatke; SEO nije zaštita pristupa.

Preview ima zabranu obilaska celog sajta i `noindex` HTTP zaglavlje na svim rutama.
Javne produkcijske stranice imaju `index, follow`. Ako se koristi hosting koji nije
Vercel, test okruženje takođe mora dobiti `VERCEL_ENV=preview` ili ekvivalentnu zabranu.

## Pre objave

### Dopuna: Lokacija (29.09.2026)

Javna `/lokacija` je dodata kao peta stranica u navigaciju i sitemap, sa zasebnim
naslovom, opisom, canonical i oznakama za deljenje. Prikazuje potvrđenu adresu
Kneza Miloša 24, Jagodina, i postojeće podatke dostave. Google mapa je preuzeta
iz opcije „Ugradite mapu” za prosleđeni profil Autoperionica SMRK; tekst jasno
objašnjava zajedničku adresu. Taj profil nije `sameAs` identitet dostave.
Ova faza dodaje mapu i izgled; `LocalBusiness` zapis ostaje sledeća celina.
Ranije provere i spisak četiri strane iz ovog dokumenta opisuju prethodnu fazu.

1. Objaviti testirani kod u isti Vercel projekat. Ovaj zadatak sam po sebi nije
   izvršio deploy niti commit.
2. `SITE_URL` je opciono; podrazumevano je `https://smrckopotrcko.rs`.
   Ako postoji u Vercel podešavanjima, mora imati taj domen. Nije isto što i
   `NEXT_PUBLIC_SITE_URL`, koji služi linkovima aplikacije. I taj operativni URL
   treba da bude `https://smrckopotrcko.rs` u produkciji, uz proveru Telegram linkova.
3. Vercel Production mora imati `VERCEL_ENV=production` (Vercel postavlja automatski).
   Posle izmene konfiguracije uraditi novi build/deploy.
4. **Proveriti `www` domen:** 15.09.2026 osnovni domen vraća HTTP 200, dok
   `https://www.smrckopotrcko.rs` pada na proveri TLS sertifikata. U Vercel
   Settings → Domains povezati `www` i podesiti DNS prema vrednostima koje
   Vercel prikaže, zatim preusmerenje na domen bez `www`. HTTPS mora raditi
   pre nego što preusmerenje može da se izvrši.
5. Proveriti da alternativni domeni/prethodna Vercel adresa vode na glavnu
   verziju. Ako se uvodi preusmerenje operativnih URL-ova, posebno proveriti
   Telegram webhook i POST zahteve; canonical oznaka ne preusmerava zahteve.

## Posle objave: Google Search Console

Search Console pokazuje da li Google čita sajt, koje strane je indeksirao i
za koje upite ga ljudi pronalaze. Za promene je potreban nalog vlasnika ili
nalog kome je vlasnik dao pristup. Status postojećeg naloga nije potvrđen.

1. Otvoriti https://search.google.com/search-console i dodati **Domain property**
   `smrckopotrcko.rs`. Potvrda ide preko DNS TXT zapisa koji Google izda.
2. Alternativa je **URL-prefix property** `https://smrckopotrcko.rs/` i HTML meta
   potvrda. Uneti samo `content` vrednost u `GOOGLE_SITE_VERIFICATION` na Vercelu,
   uraditi deploy, pa kliknuti Verify. Kod se ne nagađa.
3. U Sitemaps prijaviti `https://smrckopotrcko.rs/sitemap.xml`.
4. U URL Inspection proveriti `/`, `/kupovina`, `/cena`, `/saradnja` i po potrebi
   zatražiti indeksiranje. Pregledati izabrani canonical i rezultat live testa.
5. Pratiti Pages, Performance i Core Web Vitals. Beležiti prikaze, klikove, upite
   i strane koje dovode kupce; lokalni test brzine nije podatak stvarnih posetilaca.

## Bing i AI pretraga

1. Otvoriti https://www.bing.com/webmasters/ i dodati sajt (moguć je uvoz iz
   potvrđenog Search Console naloga).
2. Za HTML potvrdu koristi se `BING_SITE_VERIFICATION`, samo `content` vrednost
   taga `msvalidate.01`, pa novi deploy.
3. Poslati isti sitemap i proveriti indeksiranje.

Sadržaj i JSON-LD dostupni su u početnom HTML-u, bez popunjavanja forme ili
izvršavanja klijentskog JavaScripta. Nema zabrane AI pretraživača u javnom
robots pravilu. Poseban `llms.txt` nije uslov za Google AI rezultate i nije
uveden kao navodno sredstvo za bolje rangiranje. Pristup robotima ne znači
da će model obavezno pomenuti biznis niti da će njegova ranije naučena znanja biti ažurirana.
Posle objave treba proveriti i da Vercel zaštita/firewall ne blokira legitimne robote.

## Lokalna pretraga: Google Business Profile

Ovo je zaseban profil firme u Google pretrazi i na mapama. Status profila nije
potvrđen; ne praviti duplikat ako već postoji.

1. Vlasnik pronalazi/preuzima postojeći profil ili kreira profil preko
   https://business.google.com/ i prolazi Google verifikaciju.
2. Koristiti isti naziv **Šmrčko Potrčko**, broj **066 59 355 35**, sajt
   **https://smrckopotrcko.rs** i radno vreme **08:00–23:00, svaki dan**.
3. Izabrati stvarno odgovarajuću kategoriju iz Google ponude i područje dostave.
   U Google profilu biraju se stvarni gradovi/mesta ili poštanski brojevi,
   ne kružni radijus od 30 km; konkretna okolna mesta potvrđuje vlasnik.
   Ako nema poslovnice koja prima kupce, podesiti uslužni biznis sa područjem
   rada i sakrivenom adresom, prema Google uslovima.
4. Dodati stvarne fotografije biznisa i kurira uz dozvolu. Tražiti iskrene
   recenzije stvarnih kupaca, bez kupovine ili izmišljanja ocena.
5. U Facebook i Instagram profil upisati isti glavni domen i uskladiti kontakt.

Predlog opisa, sastavljen iz postojećeg sadržaja:

> Šmrčko Potrčko vrši dostavu u Jagodini i do 30 km oko grada. Hrana,
> namirnice, apoteka ili bilo šta drugo — reci nam šta ti treba i donosimo na
> tvoju adresu. Poruči preko sajta ili telefonom. Potrčko ide i u kupovinu:
> ti napiši listu, mi kupimo u marketu i donesemo na vrata. Za pravna lica
> nudimo dostavu danas za odmah, danas za danas ili po dogovorenom ugovoru.
> Radimo svaki dan od 08:00 do 23:00.

Google lokalne rezultate određuje i prema relevantnosti, udaljenosti i
prepoznatljivosti biznisa. Kod ne može garantovati prvo mesto niti pokriti
nepodešen/verifikovan profil firme.

## Provere

- `npm.cmd run build` — produkcijski build i TypeScript.
- `node --test tests/seo.test.mjs` — glavni domen, privatne rute, preview i sitemap.
- `node --test tests/*.test.mjs` — svih 46 testova prošlo (uključuje 4 nova SEO testa).
- ESLint izmenjenih fajlova; ceo repo ima prethodno postojeće probleme u
  `guest-order-form.tsx`, `price-calculator-form.tsx`, `tests/load-typescript.mjs`
  i `tmp/verify-addresses.cjs`.
- Lokalni produkcijski HTTP: četiri javne strane 200 i `index, follow`;
  privatne strane/redirecti/API imaju `X-Robots-Tag: noindex, nofollow`;
  `robots.txt`, `sitemap.xml` i OG PNG vraćaju 200; strukturirani JSON se parsira.
- Browser: javne stranice, mobilni prikaz, navigacija i početno stanje formi.
  Bez slanja stvarnih porudžbina ili upita.
- Završni axe pregled mobilne `/kupovina`: 0 prijavljenih prekršaja; kontrast
  preko hero gradijenta ostaje za ručnu proveru (alat ga ne može pouzdano oceniti).
  Ovo nije potvrda potpune pristupačnosti svih stranica i svih stanja.
- Nakon deploy-a: ponoviti za javni domen kroz
  https://pagespeed.web.dev/, https://search.google.com/test/rich-results
  i https://validator.schema.org/. Schema.org validnost nije garancija Google
  proširenog prikaza. Core Web Vitals stvarnih korisnika proveravaju se u Search Console.

## Zvanični izvori

- Google AI i SEO: https://developers.google.com/search/docs/appearance/ai-features
- Google noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Lokalno rangiranje: https://support.google.com/business/answer/7091
- Područje uslužnog biznisa: https://support.google.com/business/answer/9157481
- LocalBusiness podaci: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Next.js: lokalna dokumentacija `node_modules/next/dist/docs/`, verzija 16.3.3.

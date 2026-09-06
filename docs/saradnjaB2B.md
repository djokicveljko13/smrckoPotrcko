# Stranica „Saradnja" — B2B ulaz za firme

## Kontekst

Danas sajt ima jednu publiku: **fizičko lice koje naruči jednu vožnju**. Klijent
želi drugu publiku — **firme koje nemaju svog kurira** (pekare, restorani,
apoteke, cvećare, prodavnice) i kojima se ne isplati da zaposle vozača.

To je drugačiji razgovor od „donesi mi pice". Firma ne popunjava porudžbinu —
ona traži **dogovor**: koliko dostava dnevno, u koje vreme, po kojoj ceni. Zato
ovo nije nova varijanta forme za porudžbinu, nego zasebna stranica čiji je
jedini cilj da firma ostavi broj telefona, a vlasnik je pozove.

**Šta se NE radi:** nema tabele `partners`, nema kataloga, nema naloga za firme,
nema cenovnika za firme na sajtu (cena je stvar dogovora telefonom). Upit se
**ne čuva u bazi** — ide vlasniku na mejl i tu se priča završava. AGENTS.md i
dalje drži da katalog partnera nije V1; ova stranica tu granicu ne prelazi.

**Dve stvari u repou trenutno ne postoje i moraju da se naprave:**

1. **Navigacija.** Sajt nema nijedan meni — početna je jedan scroll
   (hero → forma → kontakt → traka). Jedini link ka drugoj ruti je sitno
   „Tabla vlasnika" na dnu ([app/page.tsx:204-211](../app/page.tsx#L204-L211)).
   Traženi „tab" znači da uvodimo nav traku koje nema.
2. **Slanje mejla.** Nigde u projektu nema slanja mejla — `package.json` ima
   samo Next, React i Supabase (nema `resend`, `nodemailer`). Faza 9 iz
   AGENTS.md („mejl vlasniku") je i dalje neurađena. Ovo je prvi mejl u
   aplikaciji.

**Odluke koje si već doneo:** sticky nav gore sa tabovima · Resend preko običnog
`fetch` (bez novog npm paketa) · forma od 3 polja (firma, telefon, poruka).

---

## Način rada (AGENTS.md)

Ovo je projekat za učenje. Isporuka ide **fazu po fazu**: prvo objašnjenje
*zašto* i *šta*, pa mali komad koda, pa pauza dok ne bude jasno — ne ceo feature
odjednom. Bez commit-a osim ako ga eksplicitno tražiš.

---

## Faza 0 — AGENTS.md pre koda

Pravilo repoa: kad klijent promeni zahtev, **prvo se ažurira AGENTS.md**.

Dodaje se kratak odeljak „Saradnja (B2B upit)": šta stranica jeste (samo upit za
kontakt, ne porudžbina), da se **ne upisuje u bazu**, da ide na mejl vlasniku,
i da katalog partnera i dalje nije V1. Uz to jedna rečenica u „Tech stack" da je
Resend sada stvarno uveden, i jedna u „Šta nije V1": stranica pominje pristup
firme sistemu, ali **nalog za firmu nije V1** — dok se ne napravi, porudžbine
firmi ulaze kao `izvor = telefon`.

Novi fajl `docs/featureSaradnja.md` po ugledu na postojeće
[docs/featureGoogleMaps.md](featureGoogleMaps.md): tekst stranice, polja
forme, env promenljive, i šta se dešava kad mejl ne prođe.

---

## Faza 1 — Nav traka

**Novo:** `components/site-nav.tsx` (klijentska komponenta)

Zašto klijentska: treba joj `usePathname()` da zna koji tab je aktivan, i jedan
`scroll` slušalac. Sve ostalo na stranici ostaje serverski.

Ponašanje — jedna promenljiva stanja, `scrolled`:

- **na vrhu strane** → traka je providna preko crvenog heroja, slova bela
- **posle ~40px skrola** → bela traka, tanka donja ivica, blaga senka, slova crna

Bez toga bela slova na belom sadržaju nestaju. Slušalac je doslovno
`window.scrollY > 40` u `useEffect`-u sa `{ passive: true }` i urednim
`removeEventListener` u cleanup-u — dobra prilika da se prođe kroz to kako
`useEffect` čisti za sobom.

Sadržaj: `<BrandLogo />` levo (uz `onColor` dok je providna), desno dva
`next/link` taba — **Poruči** (`/`) i **Saradnja** (`/saradnja`). Aktivni tab
nosi crvenu podvlaku (`border-b-2 border-brand`), određenu preko `usePathname()`
i `aria-current="page"`. Dva taba staju i na telefonu — hamburger meni nije
potreban.

**Gde se ubacuje:** *ne* u [app/layout.tsx](../app/layout.tsx) — tamo bi se
pojavila i na `/admin`, `/k/[token]` i `/prijava`, koje imaju svoju logiku i ne
treba im javni meni. Umesto toga, `<SiteNav />` se renderuje kao prvo dete u
[app/page.tsx](../app/page.tsx) i u novoj `/saradnja`. `sticky top-0 z-40` radi
jer je nav sibling heroja, a ne unutar njegovog `overflow-hidden`.

**Izmena u [app/page.tsx](../app/page.tsx):** hero je `min-h-dvh`; kad iznad
njega sedne traka od `h-16`, prvi ekran postane viši od prozora i pojavi se
sitan skrol. Hero prelazi na `min-h-[calc(100dvh-4rem)]`.

**Refaktor uz put:** `HeroWave()` je danas lokalna funkcija u
[app/page.tsx:63-77](../app/page.tsx#L63-L77), a treba i novoj stranici. Seli se
u `components/hero-wave.tsx` bez promene ponašanja, a `app/page.tsx` je uvozi.

Na kraju faze: tab se vidi i klikće, `/saradnja` je još prazna.

---

## Faza 2 — Stranica `/saradnja` (samo izgled)

**Novo:** `app/saradnja/page.tsx` — serverska komponenta, svoj `export const
metadata` (nijedna stranica ga još nema osim layout-a; ovoj treba svoj title i
description jer je ulaz za firme).

Ista vizuelna gramatika kao početna, samo drugim rečima: crveni hero → beli
talas → belo telo → `<ContactStrip />` → `<AnnouncementBar />`. Bez novih boja,
bez novih paketa, bez slika.

### 1. Hero (crveno, kraće od početne — `min-h-[70vh]`, ne pun ekran)

Firma je došla po informaciju, ne po utisak; ne držimo je ceo ekran na pozdravu.

- pilula `ZA FIRME` — bela slova, providna bela pozadina, `rounded-full`
- `<h1 className="hero-title …">` **Nemate svoju kurirsku službu?**
  <br>`<span className="hero-title-accent">` **Mi trčimo za vas.**
- `<p className="hero-description">` Pekare, restorani, apoteke, cvećare,
  prodavnice — svako kome roba mora do kupca, a nema kome da je da. Vi radite
  svoj posao, mi vozimo.
- CTA `heroButtonClass` → `#saradnja-forma`
- `<HeroWave />`

Reciklira se `animate-slam-in` / `animate-rise-in` sa istim `TITLE_DELAY_MS`
ritmom kao na početnoj, uz `motion-reduce:animate-none`.

### 2. „Svoj kurir vs. mi" — dve kolone

Ovo je srce priče i ono što B2B stranice najčešće rade: ne hvališ sebe, nego
pokažeš trošak koji firma već ima.

| Leva kartica — siva, `XIcon` | Desna kartica — crna (`bg-ink`), `CheckCircleIcon` u `text-brand` |
|---|---|
| **SVOJ KURIR** | **ŠMRČKO POTRČKO** |
| Plata svakog meseca, i kad nema posla | Plaćate vožnju, ne mesec dana čekanja |
| Gorivo, registracija, servis, gume | Naše vozilo, naše gorivo, naši papiri |
| Bolovanje, godišnji, otkaz — vaš problem | Uvek ima ko da vozi |
| Jedan čovek, jedno vozilo | Više kurira odjednom kad je gužva |

Obe liste su `const` niz stringova u fajlu i mapiraju se — isti obrazac kao
`BADGES` u [app/page.tsx:22-38](../app/page.tsx#L22-L38), tako da se stavka
dodaje u podatak, a ne kopiranjem `<li>`. Na telefonu jedna ispod druge, od
`sm` naviše `grid-cols-2`. Crna kartica preuzima „račun" izgled crne trake sa
početne.

### 3. „Kako počinjemo" — tri koraka

Tri kartice sa krupnim iskošenim brojevima `01 / 02 / 03`
(`font-display text-5xl font-black italic text-brand/15` iza teksta) — to je
efekat bez ijedne slike i bez nove biblioteke.

1. **Ostavite broj** — Popunite formu ili nas pozovite. Bez ugovora na prvom koraku.
2. **Dogovorimo uslove** — Koliko dostava, u koje vreme, kako se plaća. Cena po dogovoru, ne po ceniku sa sajta.
3. **Ulazite u sistem** — Dobijate pristup našoj aplikaciji i našim kuririma.
   Porudžbina ide pravo kuriru na teren — ne čekate da neko digne slušalicu.

> **Napomena o 3. koraku.** Ovaj tekst obećava firmi **nalog u aplikaciji**, a
> nalog danas ima samo vlasnik (AGENTS.md: „Ko sme šta" — kupac je gost, firme
> nisu V1). Tekst je i dalje istinit u praksi: firma zove ili šalje spisak,
> vlasnik ga unese kao `izvor = telefon`, i dalje sve radi isto — auto-dodela,
> Telegram, statusi. Zato je formulacija „pristup našim kuririma", a ne „vaš
> panel sa lozinkom": ne obećava ekran koji ne postoji. Ako klijent bude hteo
> pravi nalog za firmu, to je zaseban feature (svoja uloga, svoj RLS, svoja
> lista porudžbina) — i tada se prvo menja AGENTS.md.

### 4. Traka „Već trčimo za"

Red pilula: `Pekare · Restorani · Apoteke · Cvećare · Prodavnice · Auto-delovi ·
Kancelarije`. Delatnosti, **ne imena firmi** — nema kataloga partnera i ne
izmišljamo reference koje ne postoje.

### 5. `#saradnja-forma`

Bela kartica, identična onoj sa početne
([app/page.tsx:149](../app/page.tsx#L149)):
`rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(16,16,16,0.45)] sm:p-7`.

Naslov **Ostavite broj, zovemo vas.** · podnaslov *Bez obaveze. Čujemo se i
vidimo da li vam se isplati.* · unutra `<PartnershipForm />` iz Faze 3.

**Nove ikonice u [components/icons.tsx](../components/icons.tsx):** `XIcon` (za
levu kolonu) i `BuildingIcon` (polje „Naziv firme"). Pišu se ručno, u istom
potpisu `{ className = "h-5 w-5" }` — u projektu nema biblioteke ikonica i ne
uvodimo je.

---

## Faza 3 — Forma (klijent + server action)

**Novo:** `components/partnership-form.tsx` — kopira obrazac iz
[components/guest-order-form.tsx](../components/guest-order-form.tsx): `"use
client"`, `useActionState`, nekontrolisani inputi (**bez** `useState` po
polju), klase isključivo iz [lib/ui.ts](../lib/ui.ts) (`labelClass`,
`fieldWithIconClass`, `fieldIconClass`, `primaryButtonClass`).

Polja:

| Polje | `name` | Obavezno | Ikonica |
|---|---|---|---|
| Naziv firme | `company` | da, `maxLength={200}` | `BuildingIcon` |
| Telefon | `phone` | da, `type="tel"`, `autoComplete="tel"`, `maxLength={40}` | `PhoneIcon` |
| Poruka | `message` | ne, `<textarea rows={3} maxLength={1000}>` | — |

Plus **honeypot**: `<input name="website">` sakriven i `tabIndex={-1}`,
`autoComplete="off"`. Pravi čovek ga ne vidi; bot popuni sva polja. Ako stigne
popunjen, server vrati „ok" a ne šalje ništa. Nula zavisnosti, nula captcha.

Razlika u odnosu na formu za porudžbinu: **uspeh je inline, nema redirekcije.**
Nema broja porudžbine da se pokaže, pa nema ni `/hvala` stranice — kartica se
zameni potvrdom (`CheckCircleIcon` + „Primili smo upit. Zovemo vas na taj
broj."). Presedan za inline uspeh već postoji u
`components/signup-form.tsx`.

Greška koristi doslovno isti banner kao ostatak sajta:
`rounded-xl border-2 border-brand bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark` uz `role="alert"`.

**Novo:** `app/actions/partnership.ts`

```
export type PartnershipState =
  | { status: "ok" }
  | { status: "error"; message: string }
  | null;
```

Koraci: `readString` (isti pomoćnik kao u
[app/actions/create-guest-order.ts:13-16](../app/actions/create-guest-order.ts#L13-L16))
→ honeypot → `company` i `phone` obavezni → `phone.length < 6` daje istu poruku
kao postojeća forma → `sendPartnershipEmail(...)`. **Nema dodira sa
Supabase-om** — upit se nigde ne čuva, to je bila tvoja odluka.

---

## Faza 4 — Slanje mejla

**Novo:** `lib/email.ts`, napisan po uzoru na
[lib/telegram.ts](../lib/telegram.ts): env se čita kroz malu funkciju koja
vraća `null` kad fali, na grešku ide `console.warn` i `return false` umesto
bacanja izuzetka, a poziv ide običnim `fetch`-om na
`https://api.resend.com/emails`. **Nema novog npm paketa** — isto kao što su
rađeni Telegram i Google.

```
POST https://api.resend.com/emails
Authorization: Bearer <RESEND_API_KEY>
{ from, to, subject, text, reply_to }
```

Subject: `Upit za saradnju — <naziv firme>`. Telo je običan tekst (firma,
telefon, poruka, vreme) — bez HTML šablona, vlasnik treba broj koji će pozvati.

**Nove env promenljive** (dodaju se u [.env.example](../.env.example) sa
komentarom, kao i sve ostale; nijedna nije `NEXT_PUBLIC_`):

- `RESEND_API_KEY` — sa resend.com, server only
- `EMAIL_FROM` — npr. `Šmrčko Potrčko <saradnja@domen.rs>`; dok domen nije
  verifikovan koristi se `onboarding@resend.dev`
- `PARTNERSHIP_EMAIL_TO` — sanduče vlasnika

**Kad mejl ne prođe:** upit se nigde ne čuva, pa bi tiho „ok" značilo izgubljenu
firmu. Zato:

- **ključ postoji, zahtev pukne** → forma vraća grešku sa telefonom vlasnika
  iz [lib/contact.ts](../lib/contact.ts) (`DISPLAY_PHONE`, nikad prekucan
  broj): „Upit nije poslat. Pozovite nas na 066 59 355 35."
- **ključa nema, `NODE_ENV !== "production"`** → ceo upit se ispiše u
  serversku konzolu i vrati se „ok", da forma može da se razvija pre nego što
  nabaviš Resend nalog
- **ključa nema u produkciji** → greška kao u prvom slučaju, da nikad ne
  ćutimo pred pravom firmom

---

## Fajlovi

**Novi**
- `app/saradnja/page.tsx`
- `app/actions/partnership.ts`
- `components/site-nav.tsx`
- `components/hero-wave.tsx`
- `components/partnership-form.tsx`
- `lib/email.ts`
- `docs/featureSaradnja.md`

**Menjani**
- [AGENTS.md](../AGENTS.md) — odeljak o Saradnji (prvo ovo)
- [app/page.tsx](../app/page.tsx) — `<SiteNav />`, izvezen `HeroWave`, hero visina
- [components/icons.tsx](../components/icons.tsx) — `XIcon`, `BuildingIcon`
- [.env.example](../.env.example) — tri Resend promenljive

**Netaknuto:** baza, migracije, RLS, Telegram tok, admin tabla, kurirski link.

---

## Provera

1. `npm run dev` → `/` — nav je providna preko crvenog heroja, posle skrola
   postane bela; „Poruči" je podvučeno crveno; hero i dalje puni ekran bez
   suvišnog skrola.
2. Klik na **Saradnja** → `/saradnja`; sada je taj tab podvučen.
3. Cela stranica na širini telefona (DevTools, 390px): dve kolone poređenja se
   slažu jedna ispod druge, nigde horizontalnog skrola, ćirilične dijakritike
   (š, č, ć, ž, đ) se ispisuju — fontovi već imaju `latin-ext`.
4. Prazna forma → browser traži firmu i telefon. Telefon „123" → serverska
   greška „prekratak".
5. Bez `RESEND_API_KEY` u dev-u: pošalji → inline potvrda, a ceo upit stoji u
   terminalu gde radi `next dev`.
6. Sa pravim ključem: mejl stigne, `Reply-To` je e-mail vlasnika, subject nosi
   naziv firme.
7. Honeypot: u DevTools upiši bilo šta u skriveni `website` i pošalji — forma
   kaže „ok", u terminalu nema ničega, mejl ne stiže.
8. `prefers-reduced-motion: reduce` (DevTools → Rendering): tekst stoji, ništa
   ne pada.
9. `npm run build` prolazi.

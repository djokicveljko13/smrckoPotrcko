# Kako zaista radi ova aplikacija

Uputstvo za snalaženje u Next.js + Supabase, pisano iz ugla nekoga ko dolazi iz
.NET-a. Ne objašnjava React osnove — ide pravo na „zašto baš ovako".

Svi primeri su iz **ovog** repoa, sa linkovima na prave linije. Otvori dokument
u jednom tabu, kod u drugom.

---

## 0. Jedna rečenica koja objašnjava svu zabunu

U .NET-u ovako izgleda put do podataka:

```
Browser → Controller → Service → Repository → EF → SQL Server
                          ↑
                  autorizacija je OVDE
```

Ovde taj lanac ne postoji. Postoji ovo:

```
Browser → PostgREST (Supabase API) → Postgres
                                         ↑
                                 autorizacija je OVDE
```

**Nema servisnog sloja.** Nema mesta između browsera i baze gde bi stajala
tvoja `if (user.CanDoThis)` logika. Zato se autorizacija **spustila u samu bazu**
(to je RLS), a ono što bi u .NET-u bile servisne metode postalo je **SQL funkcije**.

Sve ostalo u ovom dokumentu je posledica te jedne inverzije. Ako ti nešto deluje
kao proizvoljna magija — verovatno je posledica ovoga.

---

## 1. Mapa: .NET ↔ ovaj stack

| U .NET-u | Ovde | Napomena |
|---|---|---|
| `Controller` akcija koja vraća View | Server Component ([app/page.tsx](../app/page.tsx)) | Izvršava se na serveru, vraća HTML |
| `[HttpPost]` akcija + model binding | server akcija ([app/actions/](../app/actions/)) | `FormData` umesto model bindinga |
| Razor `.cshtml` | JSX u istom `.tsx` fajlu | Nema odvojenog template jezika |
| `appsettings.json` | `.env.local` | Nikad na git |
| `IConfiguration` | `process.env.NESTO` | |
| `DbContext` | Supabase klijent | Ali **ne** drži konekciju — priča preko HTTP-a |
| `[Authorize]` atribut | RLS policy u bazi | Nije u kodu aplikacije |
| Stored procedure | RPC funkcija (`create_web_order`) | Zove se sa `supabase.rpc(...)` |
| EF migracije iz C# klasa | ručno pisan SQL u [supabase/migrations/](../supabase/migrations/) | Ti pišeš SQL, ništa se ne generiše |
| Routing atributi | struktura foldera u `app/` | Folder `app/hvala/` = ruta `/hvala` |
| `Startup.cs` / middleware pipeline | [proxy.ts](../proxy.ts) | Jedan fajl, ne pipeline |

**Šta NE postoji, a navikao si da postoji:**

- servisni sloj i repozitorijum — nema ih, i to je namerno
- DI kontejner — funkcije se prosto importuju
- connection string — aplikacija nema direktnu vezu ka bazi, priča preko REST-a
- alat koji generiše migracije iz modela — SQL pišeš sam

---

## 2. Gde se šta izvršava

Ovo je najveći izvor zabune i vredi ga savladati pre svega ostalog.

### Pravilo

**Sve u `app/` je Server Component dok ne napišeš `"use client"` na vrhu fajla.**

Suprotno od očekivanja: default je server, ne browser.

- **Server Component** — izvršava se na serveru, sme da čita bazu i tajne iz
  `.env.local`, i **nikad** ne stiže u browser kao JavaScript. Ne može da koristi
  `useState`, `onClick`, `window`.
- **Client Component** (`"use client"`) — izvršava se u browseru, sme `useState`
  i `onClick`, ali **ne sme** da vidi tajne, jer se ceo taj fajl šalje korisniku.

### Na tvom kodu

[app/page.tsx](../app/page.tsx) nema `"use client"` → **server**.
[components/guest-order-form.tsx](../components/guest-order-form.tsx) ima
`"use client"` u prvoj liniji → **browser**.

Server komponenta sme da renderuje klijentsku (`<GuestOrderForm />`). Obrnuto ne
može direktno. Zato je granica postavljena baš tu: stranica je server, a samo
forma — kojoj trebaju `useState` i `onClick` — je klijent.

### `"use server"` je nešto sasvim drugo

Ne znači „ovo je server komponenta". Znači: **ove funkcije se smeju pozvati iz
browsera, a izvršiće se na serveru.**

U [app/actions/create-guest-order.ts:1](../app/actions/create-guest-order.ts#L1)
stoji `"use server"`. Forma tu funkciju poziva ovako:

```tsx
const [state, formAction, pending] = useActionState(createGuestOrder, null);
```

Izgleda kao običan poziv funkcije. **Nije.** Next je pretvorio u HTTP POST:
browser šalje `FormData` na server, server izvrši `createGuestOrder`, i vrati
rezultat. Otvori Network tab i vidi — postojaće POST zahtev.

Zato ovo funkcioniše bezbedno: telo funkcije, uključujući konekciju ka Supabase-u,
**nikad ne stiže u browser**.

### Praktična posledica: gde ide `console.log`

- u Server Componentu ili server akciji → **terminal** gde radi `npm run dev`
- u Client Componentu → **browser konzola**
- u Client Componentu, ali tokom prvog renderovanja → **oba** (server ga jednom
  odradi za HTML, pa browser ponovo)

`console.error` u
[create-guest-order.ts:59](../app/actions/create-guest-order.ts#L59) ide u
terminal. Ako si ga tražio u browseru, zato ga nisi našao.

---

## 3. Prati jednu porudžbinu kroz ceo sistem

Gost popuni formu i pritisne dugme. Evo svake stanice — i šta bi puklo bez nje.

**1. Browser: validacija**
`required` na `<input>` poljima. Browser sam odbije praznu formu.
*Bez toga:* prazna forma bi otišla na server. Zato serverska provera u koraku 4
i dalje postoji — HTML validacija se zaobilazi za 5 sekundi kroz DevTools.

**2. Browser → server: server akcija**
`useActionState` šalje POST sa `FormData`.
[guest-order-form.tsx:41](../components/guest-order-form.tsx#L41) postavlja
`pending = true`, animacija kreće.

**3. Server: čitanje polja**
[create-guest-order.ts:31-35](../app/actions/create-guest-order.ts#L31-L35) —
`readString` vadi vrednosti. Nema model bindinga kao u .NET-u; `FormData` je
mapa stringova, `formData.get()` može da vrati i `File`, pa otud provera tipa.

**4. Server: prava validacija**
Linije [37-47](../app/actions/create-guest-order.ts#L37-L47).
Ovo je jedina validacija kojoj se veruje.

**5. Server: Supabase klijent sa anon ključem**
[create-guest-order.ts:49](../app/actions/create-guest-order.ts#L49) zove
`createSupabaseServerClient()`.
Pažnja: **ovo je server, ali ključ je i dalje `anon`.** Gost nije ulogovan, pa
prema bazi nastupa kao gost. To što se kod izvršava na serveru **ne** daje mu
veća prava — prava određuje ključ, ne mesto.

**6. Server → Supabase: RPC poziv**
[linija 50](../app/actions/create-guest-order.ts#L50):

```ts
await supabase.rpc("create_web_order", { p_title, p_shop, ... })
```

Ovo je HTTP POST na Supabase (`/rest/v1/rpc/create_web_order`).
Zašto RPC a ne običan `insert` — vidi odeljak 5.

**7. Postgres: funkcija `create_web_order`**
[migracija](../supabase/migrations/20260830180000_create_web_order.sql) radi
`insert` i vraća **samo** `public_number`.

**8. Postgres: trigger pre upisa**
`set_order_defaults` se okida **pre** inserta i kuje `public_number` (`P-17`) i
`courier_token`, pa gostu forsira `source='sajt'`, `status='nova'`,
`courier_id=null`.
*Bez toga:* klijent bi mogao da pošalje `status: 'isporuceno'` ili tuđi broj.

**9. Postgres: RLS provera**
Policy `orders_anon_insert_web` proverava `WITH CHECK` — da su vrednosti baš one
koje trigger forsira. Ako nisu, insert se odbija.

**10. Nazad kroz sve slojeve**
Broj se vraća: Postgres → PostgREST → server akcija → browser.
[Linija 67](../app/actions/create-guest-order.ts#L67) vraća
`{ status: "ok", ticket, zone }`.

**11. Browser: animacija pa navigacija**
[guest-order-form.tsx:53-68](../components/guest-order-form.tsx#L53-L68) čeka da
prođu **i** server **i** pun krug auta, pa radi `router.push("/hvala?...")`.

**12. Server: `/hvala`**
[app/hvala/page.tsx](../app/hvala/page.tsx) čita broj iz URL-a i **validira ga
regexom** `^P-\d+$` pre prikaza. URL je korisnički unos — svako može da otkuca
`/hvala?broj=<script>`.

---

## 4. Tri ključa, i zašto je „anon" javan

Ovo najviše smeta ljudima iz .NET-a: ključ za bazu stoji u browseru?!

**Ključ nije lozinka za bazu.** To je izjava o tome ko si:

| Ključ | Znači | Gde sme | U kodu |
|---|---|---|---|
| `anon` | „ja sam gost, nisam ulogovan" | **javno**, u browseru | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `authenticated` | „ulogovan sam, evo tokena" | dobija se posle prijave | u kolačiću |
| `service_role` | „ja sam baza, RLS me ne dodiruje" | **samo server** | `SUPABASE_SERVICE_ROLE_KEY` |

Sa `anon` ključem možeš da pozoveš API. Ali **šta ćeš dobiti nazad, odlučuje
RLS**. Pošto `orders` nema `select` policy za `anon`, gost sa tim ključem ne može
da pročita nijednu porudžbinu — makar ga imao ispisanog na čelu.

Zato je `NEXT_PUBLIC_` prefiks ovde **namera, ne propust**. Taj prefiks u Next-u
znači „ugradi ovu vrednost u JavaScript koji ide korisniku".

**A zato bi `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` bila katastrofa:**
`service_role` **zaobilazi RLS u potpunosti**. Ko ga ima, čita i menja sve —
sve adrese, sve telefone. Nikad ga ne stavljaj u fajl koji ima `"use client"`,
i nikad mu ne daj `NEXT_PUBLIC_` prefiks.

Provera koju vredi zapamtiti: *da li bi mi smetalo da ovo neko vidi u
View Source?* Ako da — ne sme `NEXT_PUBLIC_`.

---

## 5. Postgres deo: šta je svaka od tih stvari

### Enum umesto stringa

```sql
create type public.order_status as enum ('nova','poslata_kuriru','krenuo','isporuceno');
```

Baza odbija `'gradskooo'`. U .NET-u bi ovo bio C# `enum` + provera u servisu.
Ovde provera mora da bude u bazi — jer servisa nema, a klijent može da pošalje
šta hoće.

### RLS — autorizacija red po red

`alter table public.orders enable row level security;`

Od tog trenutka: **bez policy-ja, niko ne može ništa.** Ne „sve je dozvoljeno" —
nego „sve je zabranjeno". To je bitna razlika i najčešći uzrok tihe zbunjenosti:
upit ne puca, samo vraća **prazan rezultat**.

Policy ima dva različita uslova:

- **`USING`** — „koje redove smeš da **vidiš**" (za `select`, `update`, `delete`)
- **`WITH CHECK`** — „kakvi redovi smeju da **nastanu**" (za `insert`, `update`)

Primer iz koda — gost sme da upiše porudžbinu, ali samo takvu:

```sql
create policy orders_anon_insert_web on public.orders
for insert to anon
with check (
  source = 'sajt' and status = 'nova'
  and courier_id is null and assigned_at is null
);
```

Nema `USING`, jer se kod inserta nema šta „videti". I nema `select` policy za
`anon` nigde — zato gost ne može da čita porudžbine.

### Trigger — podrazumevane vrednosti kojima se veruje

`set_order_defaults` se okida `before insert`. Zašto je broj `P-17` kuje **baza**,
a ne aplikacija:

1. **Sigurnost** — klijent ne sme da bira svoj broj ni token.
2. **Trka** — `nextval()` je atomičan. Da broj računa aplikacija sa
   `select max(...) + 1`, dve istovremene porudžbine bi dobile isti broj.

Token se kuje sa `encode(gen_random_bytes(32), 'hex')` — 32 nasumična bajta.
Zato `/k/1` ne postoji: token se ne pogađa.

### RPC + `security definer` — zašto gost ne radi običan `insert`

Odgovor je u prvom komentaru
[te migracije](../supabase/migrations/20260830180000_create_web_order.sql):

> Guest insert cannot use RETURNING / `.select()`: there is no SELECT policy for anon.

Lanac je ovakav:

1. Gostu treba broj porudžbine nazad.
2. Vraćanje podatka posle inserta je zapravo **`select`**.
3. Gost nema `select` policy na `orders`.
4. Dakle običan `insert().select()` bi pukao.

Rešenje: funkcija sa **`security definer`**.

> **`security definer`** = „izvrši se sa pravima onoga ko je funkciju **napravio**,
> a ne onoga ko je **poziva**". Kao stored procedura koja radi pod povlašćenim
> nalogom, dok pozivalac sam nema ta prava.

Gost tako sme da uradi tačno jednu usku stvar — upiše porudžbinu i dobije broj —
a i dalje ne sme da čita tabelu.

I na kraju te migracije:

```sql
revoke all on function public.create_web_order(...) from public;
grant execute on function public.create_web_order(...) to anon;
```

Prvo se svima oduzme pravo, pa se namerno vrati samo `anon`-u. Nabrajanje tipova
argumenata je obavezno jer Postgres dozvoljava više funkcija istog imena.

### Zašto postoji druga migracija koja popravlja prvu

[20260830173000_fix_guest_order_defaults.sql](../supabase/migrations/20260830173000_fix_guest_order_defaults.sql)
menja uslov iz:

```sql
if auth.role() = 'anon' then          -- prva verzija
if auth.role() is distinct from 'authenticated' then   -- popravka
```

Prva verzija je pretpostavila da je svaki neulogovan poziv tačno `'anon'`. Nije —
za javne REST pozive `auth.role()` ume da bude nešto treće, pa se zaštita **tiho
preskakala**.

Ovo je najvažnija pouka ovog odeljka: **RLS se lako napiše *skoro* tačno.**
Ništa ne pukne, ništa se ne crveni — samo zaštita ne radi. Zato se svako pravilo
proverava tako što se **pokuša ono što ne sme da prođe**, a ne samo ono što treba
da prođe.

---

## 6. Prijava vlasnika: kolačići, proxy.ts, dve brave

**Prijava.** [signIn](../app/actions/auth.ts#L8) zove
`supabase.auth.signInWithPassword`. Supabase vrati token, `@supabase/ssr` ga
upiše u **kolačić**. Otud `cookies()` u
[lib/supabase/server.ts:18](../lib/supabase/server.ts#L18).

**`proxy.ts` — samo osvežavanje.** [proxy.ts](../proxy.ts) se izvršava pre
renderovanja `/admin` i zove `supabase.auth.getUser()`. Jedini posao: ako je token
istekao, uzmi svež i vrati ga u kolačić. Bez toga bi vlasnika izbacivalo posle
nekog vremena.

**Nije zaštita.** Piše i u komentaru na vrhu fajla. Proxy je optimizovan da radi
na CDN ivici i ne treba mu verovati kao jedinoj bravi.

**Dve brave, i šta se desi ako izostaviš jednu:**

| Brava | Gde | Ako je nema |
|---|---|---|
| `requireOwner()` | [lib/auth.ts:10](../lib/auth.ts#L10) | Stranica se renderuje neulogovanom. RLS bi vratio prazno, pa bi video **praznu tablu umesto prijave** — zbunjujuće, ali ne curi. |
| RLS policy | baza | **Podaci cure.** Ko god pogodi API poziv sa anon ključem, čita sve porudžbine. |

Zato obe. `requireOwner()` je zbog **iskustva** (pošalji čoveka na prijavu),
RLS je zbog **sigurnosti**. Nikad ne uklanjaj RLS zato što „ionako imamo
`requireOwner`".

`cache()` oko `requireOwner` znači: ako i stranica i neka komponenta pozovu istu
proveru tokom jednog renderovanja, Auth se pita **jednom**.

---

## 7. Kako da sam istražuješ

Da ne zavisiš od AI-a kad nešto ne radi.

**Supabase Dashboard → SQL Editor** je tvoj najbolji alat. Tu možeš:

Vidi sva svoja RLS pravila:
```sql
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public';
```

Vidi da li je RLS uopšte uključen:
```sql
select relname, relrowsecurity from pg_class where relname in ('orders','couriers');
```

Probaj RPC ručno, bez aplikacije:
```sql
select public.create_web_order('test','Maxi','Nemanjina 4','0601234567','grad');
```

**Supabase Dashboard → Logs** — prava SQL greška. Ono što aplikacija pokaže
korisniku je uglavnom uljudna poruka; pravi razlog je ovde.

**Browser Network tab** — filtriraj po `Fetch/XHR`, pošalji formu, i videćeš POST
server akcije. Tu se vidi šta je stvarno otišlo, a šta se vratilo.

**Terminal gde radi `npm run dev`** — tu izlaze `console.log` i `console.error`
sa servera.

**Provera pre nego što nešto proglasiš gotovim:** pokušaj ono što **ne sme** da
prođe. Npr. iz browser konzole, sa anon ključem, probaj da pročitaš porudžbine.
Ako dobiješ prazno — RLS radi. Ako dobiješ podatke — ne radi.

---

## 8. Rečnik

| Pojam | Šta je |
|---|---|
| **PostgREST** | Sloj koji Postgres tabele pretvara u REST API. To je ono što Supabase klijent zapravo zove. |
| **RLS** | Row Level Security — autorizacija u samoj bazi, po redu tabele. |
| **policy** | Jedno RLS pravilo. `USING` = šta smem da vidim, `WITH CHECK` = šta sme da nastane. |
| **RPC** | Poziv SQL funkcije preko API-ja: `supabase.rpc("ime", {...})`. |
| **`security definer`** | Funkcija se izvršava sa pravima svog vlasnika, ne pozivaoca. |
| **`set search_path`** | Zaključava u kojim šemama funkcija traži imena. Obavezno uz `security definer` — bez toga napadač može da podmetne svoju funkciju. Kod nas postoji. |
| **trigger** | Kod koji baza sama pokrene pre/posle izmene reda. |
| **anon key** | Javni ključ „ja sam gost". Nije lozinka. |
| **service role** | Ključ koji zaobilazi RLS. Samo server, nikad browser. |
| **Server Component** | Podrazumevano u `app/`. Radi na serveru, ne stiže u browser. |
| **`"use client"`** | Prebacuje fajl u browser. Sme `useState`/`onClick`, ne sme tajne. |
| **`"use server"`** | Označava funkcije koje browser sme da pozove, a izvrše se na serveru. |
| **server akcija** | Takva funkcija. Izgleda kao poziv, jeste HTTP POST. |
| **`useActionState`** | React hook koji vezuje formu za server akciju i daje `[stanje, akcija, pending]`. |
| **migracija** | SQL fajl u [supabase/migrations/](../supabase/migrations/). Pišeš ga ručno. |
| **deeplink** | URL koji otvara aplikaciju na telefonu, npr. `wa.me/...` za WhatsApp. |

---

## 9. Zamke

Stvari koje izgledaju bezopasno, a nisu.

**`NEXT_PUBLIC_` na tajni.** Sve sa tim prefiksom završi u JavaScriptu koji vidi
svaki posetilac. Nikad na service role, API tokene, lozinke.

**RLS uključen bez ijedne policy.** Ne puca — samo tiho vraća prazno. Ako ti
tabla prikazuje „nema porudžbina" a znaš da ih ima, prvo proveri policy-je.

**`security definer` bez `set search_path`.** Otvorena rupa: napadač napravi
svoju funkciju u šemi koja se pretražuje pre `public`, i tvoja funkcija pozove
njegovu — sa povlašćenim pravima. Kod nas je
[postavljen](../supabase/migrations/20260830180000_create_web_order.sql), i mora
tako da ostane.

**Vraćanje viška iz server akcije.** Sve što server akcija vrati stiže u browser.
Da `create_web_order` vraća ceo red umesto samo broja, `courier_token` bi otišao
gostu. Zato vraća **samo** `public_number`.

**`redirect()` ne vraća — baca.** Po Next dokumentaciji, `redirect()` baca
`NEXT_REDIRECT` grešku koja prekida renderovanje. Posledice:
- ne piši `return redirect(...)` očekujući vrednost
- **nikad ga ne stavljaj unutar `try/catch`** — tvoj `catch` će uhvatiti
  preusmerenje i ono se neće desiti

**Klijentska validacija nije validacija.** `required` na inputu je udobnost.
Prava provera je ona na serveru, plus `CHECK` i RLS u bazi.

**Mesto izvršavanja ≠ ovlašćenje.** Server akcija koja koristi `anon` ključ ima
prava gosta, iako se izvršava na serveru. Prava daje ključ, ne lokacija.

---

## Provera razumevanja

Ako umeš da odgovoriš bez gledanja u kod, uputstvo je odradilo posao:

1. Zašto anon ključ sme u browser, a service role ne sme?
2. Šta se tačno desi kad gost pritisne „Pošalji porudžbinu"?
3. Zašto gost ne radi običan `insert` nego ide kroz `create_web_order`?
4. Šta radi `security definer` i zašto je opasan bez `set search_path`?
5. Ko dodeljuje broj `P-17` — browser, Next server, ili Postgres? Zašto baš tamo?
6. Zašto `proxy.ts` nije zaštita `/admin`, i šta je onda štiti?
7. Šta se desi ako obrišeš sve policy-je a RLS ostaviš uključen?
8. Koji deo `guest-order-form.tsx` radi u browseru, a koji na serveru?

Odgovori na 1, 3, 4, 5 su u odeljcima 4 i 5. Na 2 u odeljku 3. Na 6 u odeljku 6.
Na 7 u odeljku 5 („RLS — autorizacija red po red"). Na 8 u odeljku 2.

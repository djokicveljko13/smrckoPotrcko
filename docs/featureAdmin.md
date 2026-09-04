# Admin: samostalna registracija vlasnika, kuriri iz UI, ručna dodela

Ovaj fajl je izvor istine za vlasnički deo aplikacije. **Ako se pravilo promeni u
hodu, prvo se menja ovaj fajl, pa onda kod.** Isto pravilo važi i za `AGENTS.md`.

Status: u izradi. Odeljak „Redosled izrade" na dnu prati dokle smo stigli.

## Kako radimo — učenje je deo zadatka

Veljko mora da razume **svaki** korak. Gotov kod bez razumevanja se ovde računa
kao neuspeh. Ritam je isti kao u [featureKurir.md](featureKurir.md):

1. **Prvo ZAŠTO** — koji problem faza rešava, šta smo odbacili i zbog čega.
2. **Pojam običnim jezikom** — pre nego što se pojavi u kodu.
3. **Mali diff** — jedna faza, ne ceo feature u tišini.
4. **Stani i proveri** — objasni se šta je urađeno, sačeka se da je jasno, pa dalje.
5. **Pitanja su očekivana.**

Novi pojmovi koje treba objasniti pre upotrebe, po fazama:

| Faza | Pojam koji se prvi put pojavljuje |
|---|---|
| 1 | zašto je poređenje tajne konstantnim vremenom (`timingSafeEqual`), a ne `===` |
| 1 | šta znači „env varijabla kao prekidač" i zašto se briše posle upotrebe |
| 2 | zašto `revoke ... from public` **nije** dovoljno na Supabase-u |
| 2 | zašto se kurir gasi (`is_active`) a ne briše |
| 3 | zašto PIN nikad ne putuje nazad ka pregledaču |
| 4 | zašto ručna dodela mora `FOR UPDATE`, isto kao automatska |

## Zašto ovo radimo

Klijent danas zavisi od Veljka za tri stvari koje bi morao sam:

1. **Nalog** — pravi se ručno u Supabase Dashboardu. Klijent nema način da sam
   napravi svoj nalog i lozinku.
2. **Kuriri** — kurir se dodaje `INSERT`-om u SQL Editoru, a PIN kuje
   `mint_courier_pin`. Klijent ne može da doda kurira, promeni mu PIN, ni da ga
   ugasi. `AGENTS.md` to zasad vodi kao „nije V1" — **ovim poslom postaje V1**.
3. **Dodela** — sve radi `offer_order_to_next_courier`. Ako su svi kuriri zauzeti,
   porudžbina visi kao `nova` i vlasnik ne može ništa. Ako kurir ćuti na ponudu,
   vlasnik ne može da mu je oduzme.

Ishod: klijent sam pravi nalog (jednom, preko tajnog koda), sam vodi kurire sa
svoje table, i može rukom da pošalje porudžbinu kuriru kog izabere — **bez**
gašenja auto-dodele.

### Bezbednosno upozorenje koje oblikuje ceo plan

U ovoj aplikaciji **svaki ulogovan korisnik = vlasnik**. RLS pravila su doslovno
`to authenticated using (true)`
([prva migracija](../supabase/migrations/20260830170000_orders_and_couriers.sql)) —
nema `role` kolone, nema `profiles` tabele, nema liste dozvoljenih mejlova.

Zato je **tajni kod jedina brava** između interneta i svih adresa i telefona
kupaca. Iz toga slede dva tvrda pravila:

- Ako `OWNER_SIGNUP_CODE` **nije postavljen**, registracija je ugašena (stranica
  ne prikazuje formu, server action odbija). To je prekidač.
- Čim klijent napravi nalog, `OWNER_SIGNUP_CODE` se **briše iz Vercel env-a i radi
  se redeploy**. Ruta se sama zatvori.

## Dogovorena pravila

| Odluka | Izbor |
|---|---|
| Kapija za registraciju | tajni kod iz env-a (`OWNER_SIGNUP_CODE`) |
| Broj naloga | ciljano jedan (klijentov); kod je jedina brava, Veljkov nalog ostaje rezervni |
| Potvrda mejla | isključena (Supabase → Auth → Providers → Email → Confirm email = off) |
| Ruta | `/registracija`, bez linka sa javnog sajta |
| Link na `/prijava` | vidi se **samo** dok je kod postavljen |
| PIN kurira | vlasnik ga sam upisuje, **4–8 cifara** (danas je baza zaključana na tačno 6) |
| Kuriri iz UI | dodaj, promeni PIN, upali/ugasi, menjaj ime i telefon |
| Brisanje kurira | **ne** — samo gašenje (`is_active`), da se ne pokida istorija porudžbina |
| Predaja linka | dugme „Kopiraj link" (pun `/k/{token}` URL) |
| Ručna dodela | i porudžbine koje niko nije uzeo, **i** preotimanje od kurira koji ćuti |
| Granica preotimanja | samo do statusa `poslata_kuriru`; `krenuo` se ne dira |
| Pravila ručne dodele | ponuda kao i svaka druga — Telegram stiže, kurir sme da odbije |

## Faza 1 — Registracija vlasnika

**Novo:** `app/registracija/page.tsx`, `components/signup-form.tsx`
**Menja se:** [app/actions/auth.ts](../app/actions/auth.ts),
[app/prijava/page.tsx](../app/prijava/page.tsx), [.env.example](../.env.example)

- [lib/auth.ts](../lib/auth.ts) dobija `signupCode(): string | null` i
  `signupEnabled(): boolean` — čita `process.env.OWNER_SIGNUP_CODE`, prazan string
  = ugašeno.
- `signUp` server action u `app/actions/auth.ts`, po uzoru na postojeći `signIn`
  (isti `SignInState` oblik `{ error } | null`):
  - ako `!signupEnabled()` → `{ error: "Registracija je zatvorena." }` (prva
    provera, pre svega ostalog);
  - poređenje koda **konstantnim vremenom** — `crypto.timingSafeEqual` nad
    baferima jednake dužine, isti obrazac koji već koristi
    [webhook ruta](../app/api/telegram/webhook/route.ts);
  - lozinka min. 8 znakova, potvrda lozinke u formi;
  - `supabase.auth.signUp({ email, password })` preko `createSupabaseServerClient()`
    (isti klijent kao `signIn` — sam upiše kolačić);
  - ako `data.session === null` → potvrda mejla je ipak uključena: poruka „Proveri
    mejl i potvrdi nalog, pa se prijavi", bez redirecta;
  - inače `redirect("/admin")`.
- `app/registracija/page.tsx`: server komponenta; ulogovan korisnik → `/admin`;
  `!signupEnabled()` → kratak tekst „Registracija je zatvorena", bez forme. Ista
  vizuelna struktura kao `/prijava`.
- `components/signup-form.tsx`: kopija [login-form.tsx](../components/login-form.tsx)
  uz polja `kod`, `email`, `password`, `password2`; klase iz [lib/ui.ts](../lib/ui.ts).
- Na `/prijava` diskretan link ka `/registracija` **samo kad je `signupEnabled()`** —
  kad se kod obriše, link nestane sam. Nigde drugde na sajtu.

## Faza 2 — Baza: `is_active`, PIN 4–8, `owner_*` funkcije za kurire

**Novo:** `supabase/migrations/20260904100000_owner_courier_admin.sql`

```sql
alter table public.couriers
  add column is_active boolean not null default true;
```

Funkcije (sve `security definer`, `set search_path = public`, po uzoru na
`owner_set_delivery_price`):

- `owner_create_courier(p_name text, p_phone text, p_pin text) returns jsonb` —
  trim/validacija, PIN `^[0-9]{4,8}$`, hash
  `extensions.crypt(p_pin, extensions.gen_salt('bf', 10))`, insert; vraća
  `{ ok, id, access_token }`. `access_token` i dalje pravi DEFAULT kolone.
- `owner_set_courier_pin(p_courier_id uuid, p_pin text)` — nov hash +
  `pin_failed_count = 0`, `pin_locked_until = null` (usput otključava kurira
  zaključanog sa 5 promašaja).
- `owner_update_courier(p_courier_id uuid, p_name text, p_phone text)`.
- `owner_set_courier_active(p_courier_id uuid, p_active boolean)` — pri gašenju:
  - odbij ako kurir ima porudžbinu u statusu `krenuo` → `{ ok:false, error:'on_ride' }`
    (vožnja u toku se ne kida);
  - `on_shift = false`, `is_active = false`;
  - `delete from public.courier_sessions where courier_id = ...` — trenutno
    izbacivanje; to je i bio razlog što je sesija red u tabeli a ne potpisan
    kolačić ([lib/courier-auth.ts](../lib/courier-auth.ts));
  - ako ima otvorenu ponudu (`poslata_kuriru`): ponuda → `outcome='istekla'`,
    porudžbina nazad na `nova`, pa `perform public.offer_order_to_next_courier(...)`;
  - pri paljenju samo `is_active = true` (smenu kurir sam pali).

Izmene postojećih funkcija u istoj migraciji:

- `courier_login` — regex `^[0-9]{6}$` → `^[0-9]{4,8}$`, plus provera
  `if not v_courier.is_active then ... 'inactive'`.
- `courier_peek` — vraća ime samo za `is_active` kurira, pa ugašen link daje 404.
- `offer_order_to_next_courier` — u `where` klauzulu dodati `and c.is_active`
  (ugašen kurir ne ulazi u rotaciju).

**Grantovi — ovde se pravi klasična greška.** `revoke ... from public` nije
dovoljno; Supabase ima `ALTER DEFAULT PRIVILEGES` koji svakoj novoj funkciji
direktno daje `execute` rolama `anon`/`authenticated`. Za svaku `owner_*` funkciju
ide poimence:

```sql
revoke execute on function public.owner_create_courier(text, text, text) from anon;
grant  execute on function public.owner_create_courier(text, text, text) to authenticated;
```

Uzor: [20260902130000_lock_pricing_grants.sql](../supabase/migrations/20260902130000_lock_pricing_grants.sql).
Na dnu migracije idu komentarisani testovi
(`has_function_privilege('anon', ...)` mora `false`, `authenticated` `true`).

## Faza 3 — UI: `/admin/kuriri`

**Novo:** `app/admin/kuriri/page.tsx`, `app/actions/couriers.ts`,
`components/admin/courier-create-form.tsx`, `components/admin/courier-row.tsx`,
`components/admin/copy-link-button.tsx`
**Menja se:** [app/admin/page.tsx](../app/admin/page.tsx) (link „Kuriri" u zaglavlju)

- Zasebna stranica, ne tabla — tabla je operativni ekran i ostaje čista.
  [proxy.ts](../proxy.ts) već pokriva `/admin/:path*` i ne dira se; prava zaštita
  je `await requireOwner()` na vrhu stranice.
- `app/actions/couriers.ts`: četiri akcije (`createCourier`, `setCourierPin`,
  `updateCourier`, `setCourierActive`), svaka `await requireOwner()` →
  `supabase.rpc(...)` → `revalidatePath("/admin/kuriri")`. Doslovno isti oblik kao
  [set-delivery-price.ts](../app/actions/set-delivery-price.ts), uključujući
  proveru `data.ok === false`.
- `courier-row.tsx`: ime, telefon, značka „na smeni / van smene", „Telegram
  povezan / nije", pun link `${NEXT_PUBLIC_SITE_URL}/k/{access_token}` +
  „Kopiraj link", polje za nov PIN i dugme „Ugasi/Upali".
- PIN se **nigde ne prikazuje** — vlasnik ga sam kuca, u bazi stoji samo bcrypt
  hash. `mint_courier_pin` ostaje u bazi kao rezerva iz SQL Editora, iz UI se ne zove.
- `pattern="[0-9]{4,8}"` / `maxLength={8}` u svim PIN poljima — i u
  [components/courier/pin-form.tsx](../components/courier/pin-form.tsx), gde je
  danas zakucano 6.

## Faza 4 — Ručna dodela sa table

**Novo:** `supabase/migrations/20260904110000_owner_offer_order.sql`,
`app/actions/assign-order.ts`, `components/admin/assign-courier-form.tsx`
**Menja se:** [app/admin/page.tsx](../app/admin/page.tsx),
[components/admin/order-card.tsx](../components/admin/order-card.tsx)

`owner_offer_order_to_courier(p_order_id uuid, p_courier_id uuid) returns jsonb`:

- `select ... for update` nad porudžbinom — isti razlog kao u
  `offer_order_to_next_courier`: dva klika u istoj sekundi ne smeju da daju dva kurira;
- dozvoljeno samo za status `nova` ili `poslata_kuriru`; `krenuo` i `isporuceno` →
  `{ ok:false, error:'not_offerable' }`;
- cilj mora biti `is_active` i **ne sme već imati** porudžbinu u
  `poslata_kuriru`/`krenuo` → `{ ok:false, error:'busy' }`. Ovim se čuva pravilo
  „jedan kurir = jedna živa vožnja" na koje se oslanja `courier_respond_to_offer`;
- ako je porudžbina već bila kod nekog kurira: ta ponuda → `outcome='istekla'`,
  `responded_at = now()`. Vrednost već postoji u enumu `offer_outcome`; „istekla"
  je poštenije od „odbijena" jer kurir nije odbio, a i dalje sprečava da mu se ista
  porudžbina automatski vrati;
- upis: `courier_id`, `status='poslata_kuriru'`, `assigned_at=now()`;
  `insert into order_offers ... on conflict (order_id, courier_id) do update set
  outcome='ponudjena', offered_at=now(), responded_at=null`;
  `couriers.last_offer_at = now()`;
- vraća `{ ok:true, courier_id }`;
- grantovi: `revoke ... from anon`, `grant ... to authenticated`.

Od tog trenutka tok je **identičan** auto-dodeli: `courier_respond_to_offer` radi
bez ijedne izmene, kurir sme da odbije, a odbijena porudžbina ide dalje po redu.

TypeScript strana:

- `app/actions/assign-order.ts` — `requireOwner()` → RPC → na `ok` pozovi
  `await sendOffer(courier_id)` iz [lib/telegram.ts](../lib/telegram.ts) →
  `revalidatePath("/admin")`. Isti redosled kao u
  [app/actions/courier.ts](../app/actions/courier.ts): prvo baza, pa Telegram.
- `app/admin/page.tsx` dohvata i listu kurira (`id, name, on_shift, is_active,
  telegram_chat_id` + da li ima živu vožnju) i prosleđuje je karticama.
- `assign-courier-form.tsx` — `<select>` + dugme „Pošalji kuriru", vidi se samo za
  `nova` i `poslata_kuriru`. Kuriri sa živom vožnjom su `disabled` uz oznaku
  „zauzet"; kurir van smene se **vidi i sme da se izabere** (Telegram ga probudi),
  samo je označen. Kurir bez Telegrama nosi upozorenje „nema Telegram — zovi ga".

## Faza 5 — Dokumentacija

- `AGENTS.md`, tabela „Ko sme šta": vlasnik sada sam pravi nalog preko tajnog koda
  i sam vodi kurire.
- `AGENTS.md`, „Šta nije V1": izbaciti „CRUD kurira u UI (kurire za sad u bazu)" —
  postaje V1.
- `AGENTS.md`, „Tok V1": vlasnik sme rukom da pošalje porudžbinu kuriru;
  auto-dodela ostaje podrazumevana.
- [featureKurir.md](featureKurir.md): novi `owner_*` RPC-jevi, `is_active`,
  PIN 4–8. Usput ispraviti zastareo pomen `components/admin/assign-courier-buttons.tsx` —
  taj fajl više ne postoji.

## Env (dopuniti [.env.example](../.env.example))

```
# Tajni kod za jednokratnu registraciju vlasnika. Dok stoji ovde, /registracija radi.
# ČIM klijent napravi nalog: obriši ga sa Vercela i uradi Redeploy — ruta se zatvori.
# Nikad NEXT_PUBLIC_ (to bi ga poslalo u pregledač). Na Vercelu tip "Secret".
OWNER_SIGNUP_CODE=
```

Van koda, u Supabase Dashboardu: Authentication → Providers → Email →
**Confirm email = off**.

## Redosled izrade

- [ ] 1. Registracija: `signupEnabled()`, `signUp` akcija, `/registracija`, uslovni link na `/prijava`
- [ ] 2. Migracija: `is_active`, PIN 4–8, `owner_*` funkcije za kurire + grantovi
      (SQL u `supabase/migrations/`; treba da se pokrene u Supabase)
- [ ] 3. UI `/admin/kuriri`: dodaj, izmeni, nov PIN, ugasi/upali, kopiraj link
- [ ] 4. Ručna dodela: `owner_offer_order_to_courier` + izbor kurira na kartici
      (SQL u `supabase/migrations/`; treba da se pokrene u Supabase)
- [ ] 5. Ažuriranje `AGENTS.md` i `featureKurir.md`

## Provera

**Faza 1 — registracija**

1. Bez `OWNER_SIGNUP_CODE` u `.env.local`: `/registracija` pokazuje „zatvoreno",
   na `/prijava` nema linka.
2. Sa kodom: pogrešan kod → greška; tačan kod → nov nalog i redirect na `/admin`.
3. Supabase → Authentication → Users: nov korisnik postoji, `email_confirmed_at`
   popunjen.
4. Ugasi kod, restartuj `npm run dev` → ruta opet zatvorena.

**Faza 2 — baza** (SQL Editor)

```sql
select has_function_privilege('anon','public.owner_create_courier(text,text,text)','execute');          -- false
select has_function_privilege('authenticated','public.owner_create_courier(text,text,text)','execute'); -- true
```

Zatim ugasi kurira kome je poslata ponuda → porudžbina mora da padne nazad na
`nova` i ode drugom kuriru.

**Faza 3 — UI kuriri**

5. Dodaj kurira sa PIN-om od 4 cifre, otvori kopirani `/k/{token}`, prijavi se tim PIN-om.
6. Promeni PIN → stari više ne radi, nov radi.
7. Ugasi kurira → njegov `/k/{token}` daje 404, a sesija mu je ubijena (osveži mu stranicu).

**Faza 4 — ručna dodela**

8. Skini sve kurire sa smene, pošalji porudžbinu sa sajta → ostaje `nova`. Sa table
   je rukom pošalji kuriru → status `poslata_kuriru`, Telegram stigao.
9. Kurir klikne „Ne mogu" → porudžbina se vraća u red (isti tok kao ranije).
10. Porudžbina je kod kurira A (`poslata_kuriru`), sa table je pošalji kuriru B →
    A je više ne vidi, B dobija Telegram, u `order_offers` stoji `istekla` za A.
11. Pokušaj dodele kuriru koji je `krenuo` → poruka „zauzet", ništa se ne menja.

**Napomena za lokalni test:** Telegram dugme se ne šalje sa `localhost`
(`isPublicHttpUrl` u [lib/telegram.ts](../lib/telegram.ts)) — tekst poruke stiže,
dugme ne. Pun test dugmeta ide tek na produkciji.

Posle svake faze: `npx tsc --noEmit` i `npm run lint`.

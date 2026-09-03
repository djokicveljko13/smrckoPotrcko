# Kuriri: automatska dodela + zaštićena kurirska stranica

Ovaj fajl je izvor istine za kurirski deo aplikacije. **Ako se pravilo promeni u
hodu, prvo se menja ovaj fajl, pa onda kod.** Isto pravilo važi i za `AGENTS.md`.

Status: u izradi. Odeljak „Redosled izrade" na dnu prati dokle smo stigli.

## Kako radimo — učenje je deo zadatka

Veljko mora da razume **svaki** korak. Gotov kod bez razumevanja se ovde računa
kao neuspeh. Zato za svaku fazu iz odeljka „Redosled izrade" važi isti ritam:

1. **Prvo ZAŠTO** — koji problem faza rešava, šta smo odbacili i zbog čega.
2. **Pojam običnim jezikom** — pre nego što se pojavi u kodu (dole je spisak).
3. **Mali diff** — jedna faza, ne ceo feature u tišini.
4. **Stani i proveri** — objasni se šta je urađeno, sačeka se da je jasno, pa dalje.
5. **Pitanja su očekivana.** Ako nešto nije jasno, vraćamo se na to pre nego što
   nastavimo — ne gomilamo nerazumljive slojeve.

Novi pojmovi koje treba objasniti pre upotrebe, po fazama:

| Faza | Pojam koji se prvi put pojavljuje |
|---|---|
| 1 | zašto se PIN heširа a ne čuva; čemu služi `security definer` |
| 2 | šta je sesija, zašto kolačić `httpOnly`, zašto sesija u tabeli a ne potpisan kolačić |
| 3 | zašto kurir ne sme direktan `update` na `orders` |
| 4 | **trka** (dva zahteva u istoj sekundi) i šta tačno radi `FOR UPDATE SKIP LOCKED` |
| 5 | šta je webhook; zašto bot token nikad ne sme u browser |
| 6 | šta je cron; zašto tajmer mora van aplikacije |
| 7 | zašto vlasnik zadržava ručnu rezervu |

## Zašto ovo radimo

Danas vlasnik mora da sedi za tablom: klikne kurira, otvori mu se WhatsApp sa
pripremljenim tekstom, i **on** pritisne Send. Ako niko nije za tablom,
porudžbina stoji. Klijent traži da porudžbina sama ode kuriru koji je slobodan,
i da kurir sam evidentira da je isporučio.

Dva nalaza koja oblikuju ceo plan:

1. **`wa.me` ne može automatski.** Deeplink je samo pripremljen tekst u
   WhatsAppu — čovek mora da pritisne Send. `AGENTS.md` zabranjuje WhatsApp Cloud
   API. Zato auto-dodela bez drugog kanala obaveštenja nije funkcija nego samo
   red u bazi koji niko ne vidi. **Uvodimo Telegram bota** kao kanal koji radi
   bez čoveka (besplatan, stiže i kad je telefon zaključan).

2. **Goli token u linku je preslab.** Link stigne na Telegram i zauvek ostane u
   istoriji ćaskanja; ko ga ima, vidi adrese i telefone svih kupaca tog kurira i
   može da klikne „isporučeno". Zato uz link ide **PIN**, sesija od ~12h, i
   dugme kojim vlasnik poništava pristup.

Ovo menja zahtev iz `AGENTS.md` („Kurir | Nema nalog | Samo tajni URL"), pa se
**`AGENTS.md` ažurira u sklopu ovog posla** — to je pravilo samog repoa.

## Dogovorena pravila

| Odluka | Izbor |
|---|---|
| Kanal obaveštenja | Telegram bot |
| Kurirski link | stalni po kuriru, `/k/{token}` |
| Zaštita | token + 6-cifreni PIN, zaključavanje posle 5 promašaja |
| Trajanje sesije | ~12h (do kraja smene) |
| Gašenje pristupa | dugme na tabli — nov token + nov PIN, sve sesije padaju |
| Prihvatanje | kurir mora da klikne „Prihvatam" |
| Odbijanje | dugme „Ne mogu" → odmah sledećem |
| Bez odgovora | posle 3 min ide sledećem slobodnom |
| Nema slobodnih | red čekanja; čim se neko oslobodi, ide najstarija |
| Izbor kurira | onaj ko je najduže bez dodele |
| Slobodan | `on_shift = true` **i** nema porudžbinu u `poslata_kuriru`/`krenuo` |
| Smena | kurir sam pali/gasi sa svoje stranice |
| Telefonske porudžbine | isto pravilo kao sa sajta |
| Statusi | postojeći, bez novog enum-a |
| Vlasnik | uvek može da preotme porudžbinu |

**Statusi se ne menjaju**, samo im se precizira značenje:

- `nova` — nema kurira (čeka u redu ili su svi odbili)
- `poslata_kuriru` — **ponuđena** konkretnom kuriru, čeka njegovo prihvatanje (rok 3 min)
- `krenuo` — kurir prihvatio i vozi
- `isporuceno` — gotovo

## Baza

### `couriers` — nove kolone

`access_token` (unique, 32 nasumična bajta kao postojeći `orders.courier_token`),
`pin_hash`, `pin_failed_count`, `pin_locked_until`, `telegram_chat_id`,
`last_offer_at` (kad je kurir poslednji put dobio ponudu; `null` = još nikad,
zato `order by last_offer_at nulls first`).

PIN se heširа sa `extensions.crypt(pin, extensions.gen_salt('bf', 10))` —
`pgcrypto` je već uključen u
[prvoj migraciji](../supabase/migrations/20260830170000_orders_and_couriers.sql).
PIN se nigde ne čuva u čistom obliku; vlasniku se prikaže jednom pri kovanju.

### Nove tabele

- **`order_offers`** — `(order_id, courier_id, offered_at, responded_at, outcome)`
  gde je outcome `ponudjena | prihvacena | odbijena | istekla`.
  Bez ove tabele ne može da se ispuni „ne nudi ponovo onome ko je odbio", a uz to
  daje i trag ko je kome šta nudio.
- **`courier_sessions`** — `(token, courier_id, expires_at)`. Razlog što sesija
  nije samo potpisan kolačić: „Poništi pristup" mora da **obori postojeće sesije**,
  a potpisan kolačić se ne može opozvati dok ne istekne.

RLS: nijedna od ove dve tabele nema policy za `anon` — pristup ide isključivo
kroz `security definer` funkcije, po pravilu iz `AGENTS.md`.

### Ključne funkcije

**`offer_order_to_next_courier(p_order_id)`** — srce sistema:

```sql
select c.id from couriers c
where c.on_shift
  and not exists (select 1 from orders o
                  where o.courier_id = c.id
                    and o.status in ('poslata_kuriru','krenuo'))
  and not exists (select 1 from order_offers f
                  where f.order_id = p_order_id and f.courier_id = c.id)
order by last_offer_at nulls first
limit 1
for update of c skip locked;
```

`FOR UPDATE ... SKIP LOCKED` je **obavezan**: bez njega dve porudžbine koje
stignu u istoj sekundi obe dobiju istog slobodnog kurira i dodela se duplira.
`nulls first` znači da kurir koji još ništa nije vozio ide prvi.

Ostale: `courier_login(token, pin)`, `courier_set_shift(session, bool)`,
`courier_respond_to_offer(session, order_id, prihvata bool)`,
`courier_mark_delivered(session, order_id)`, `expire_stale_offers()`,
`revoke_courier_access(courier_id)`.

Kad kurir označi `isporuceno` ili ugasi pa upali smenu → povlači se najstarija
`nova` porudžbina iz reda (drenaža reda čekanja).

## Aplikacija

- **`lib/supabase/admin.ts`** (novo) — klijent sa `SUPABASE_SERVICE_ROLE_KEY`,
  samo server. Auto-dodela ne sme da ide preko `anon` ključa.
- **`lib/courier-auth.ts`** (novo) — `requireCourier()`, po uzoru na postojeći
  `requireOwner()` u [lib/auth.ts](../lib/auth.ts), uključujući `cache()`.
- **`app/k/[token]/page.tsx`** — bez sesije prikazuje PIN ekran; sa sesijom
  prikazuje smenu, ponudu (Prihvatam / Ne mogu), aktivnu vožnju (Isporučeno) i
  današnju istoriju. Kolačić: `httpOnly`, `secure`, `sameSite=lax`, `path=/k`, 12h.
- **`app/actions/courier.ts`** — akcije koje samo pozivaju gornje RPC-ove.
- **`app/api/telegram/webhook/route.ts`** — hvata `/start <token>` i upisuje
  `telegram_chat_id`. Zaštita: Telegram `secret_token` zaglavlje.
- **`lib/telegram.ts`** — `sendOffer()` preko `api.telegram.org/bot<TOKEN>/sendMessage`,
  sa dugmetom ka `/k/{token}`. Tekst ponovo koristi postojeći
  `buildCourierMessage()` iz [lib/whatsapp.ts](../lib/whatsapp.ts) — ista poruka,
  drugi kanal.
- **`app/api/dispatch/tick/route.ts`** — poziva `expire_stale_offers()`; štiti se
  `CRON_SECRET` zaglavljem. Okida ga Supabase Cron (pg_cron) svakog minuta.
  Vercel Hobby cron ide samo jednom dnevno, zato pg_cron.
- **Admin tabla** — red čekanja izdvojen na vrh, na kartici se vidi kome je
  ponuđeno i koliko ističe, plus „Preotmi" i „Poništi pristup". Postojeći
  WhatsApp put iz
  [assign-courier-buttons.tsx](../components/admin/assign-courier-buttons.tsx)
  **ostaje** kao ručna rezerva.

**Realtime se ne uvodi, polling se ne uvodi** — `AGENTS.md` to izričito brani dok
se ne pređe faza 10. Kurira budi Telegram; stranica ima dugme za osvežavanje.

## Env (dopuniti `.env.example`)

`SUPABASE_SERVICE_ROLE_KEY` (već zakomentarisan, sada se koristi),
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`,
`CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` (za link u Telegram poruci).
Nijedan osim `NEXT_PUBLIC_SITE_URL` ne sme da ima prefiks `NEXT_PUBLIC_`.

## Faza 4 — zaključane odluke

Objašnjenje kako je urađeno: [kako-radi-auto-dodela.md](kako-radi-auto-dodela.md).

1. Nova porudžbina sa sajta: `create_web_order` odmah posle `insert` zove
   `offer_order_to_next_courier`. Nije `AFTER INSERT` trigger. Unos sa telefona
   još nema UI; kad dođe, mora isto da zove dodelu.
2. „Ne mogu“: **ta ista** porudžbina ide sledećem slobodnom (sme da skoči
   ispred starijih u redu).
3. „Isporučeno“ / paljenje smene: **round-robin** — bira se ko je najduže bez
   ponude (`last_offer_at`), ne obavezno kurir koji se upravo oslobodio.
4. `offer_order_to_next_courier` i `drain_waiting_orders` **nisu javni RPC** —
   `REVOKE ALL`, bez `GRANT` za `anon`/`authenticated`. Zovu ih samo druge
   `security definer` funkcije. Test iz SQL editora.
5. Admin WhatsApp dugmad ostaju. Auto-dodela dira samo `status = 'nova'` i
   `courier_id is null`.

## Redosled izrade

Radimo fazu po fazu, po ritmu iz odeljka „Kako radimo" — ne sve odjednom.
Posle svake faze staje se i proverava da je jasno.

- [x] 0. Ovaj dokument u repo kao `docs/featureKurir.md`
- [x] 1. Migracija: kolone na `couriers`, `order_offers`, `courier_sessions`, RLS
      (fajl je u `supabase/migrations/`; SQL treba da se pokrene u Supabase)
- [x] 2. `courier_login` + PIN ekran + sesija (`/k/{token}` samo prikazuje ime kurira)
      (SQL u `supabase/migrations/` treba da se pokrene u Supabase)
- [x] 3. Kurirska stranica: smena, prihvati/odbij, isporučeno
      (SQL u `supabase/migrations/` treba da se pokrene u Supabase)
- [x] 4. Auto-dodela u bazi (`offer_order_to_next_courier`, drenaža reda) — testira se SQL-om
      (SQL u `supabase/migrations/`; treba da se pokrene u Supabase.
      Objašnjenje: [kako-radi-auto-dodela.md](kako-radi-auto-dodela.md))
- [x] 5. Telegram: webhook za `/start`, pa slanje ponude
      (SQL u `supabase/migrations/`; treba da se pokrene u Supabase.
      Objašnjenje: [kako-radi-telegram.md](kako-radi-telegram.md))
- [ ] 6. Istek ponude: `expire_stale_offers()` + Supabase Cron
- [ ] 7. Admin: red čekanja, preotimanje, poništavanje pristupa
- [ ] 8. Ažuriranje `AGENTS.md`

## Provera

- **Trka (najvažnije):** dva `create_web_order` poziva u istoj sekundi uz jednog
  slobodnog kurira → tačno jedan dobije `poslata_kuriru`, drugi ostaje `nova`.
  Ovo se testira SQL-om, ne kroz UI.
- **Red čekanja:** kurir sa aktivnom vožnjom + nova porudžbina → ostaje `nova`;
  kurir klikne „Isporučeno" → porudžbina iz reda mu odmah stiže.
- **Rotacija:** tri porudžbine zaredom uz dva slobodna kurira → smenjuju se.
- **PIN:** pogrešan PIN 5 puta → zaključano; tačan PIN posle zaključavanja i
  dalje odbijen dok ne istekne.
- **Poništavanje:** vlasnik klikne „Poništi pristup" dok je kurir ulogovan →
  kurirova sledeća akcija pada na PIN ekran, stari link mrtav.
- **Istek ponude:** ponudi kuriru, ne diraj 3 min → prelazi na drugog, prvi je
  u `order_offers` zabeležen kao `istekla`.
- **Odbijanje:** „Ne mogu" → odmah drugom, i prvom se **više ne nudi** ta ista.
- Posle svake faze: `npx tsc --noEmit` i `npm run lint`.

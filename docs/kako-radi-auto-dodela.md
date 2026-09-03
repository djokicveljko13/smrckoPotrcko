# Kako radi auto-dodela kurira (faza 4)

Uputstvo za fazu 4. Čitaj posle
[kako-radi-aplikacija.md](kako-radi-aplikacija.md) — tamo je zašto autorizacija
stoji u bazi. Ovde je **sledeći korak**: baza ne samo da čuva red, nego **sama
bira** kome da ponudi vožnju.

Izvor pravila: [featureKurir.md](featureKurir.md). Kod:
[supabase/migrations/20260831140000_offer_order_to_next_courier.sql](../supabase/migrations/20260831140000_offer_order_to_next_courier.sql).

Telegram je faza 5: [kako-radi-telegram.md](kako-radi-telegram.md). Ova faza
samo upisuje `poslata_kuriru` u bazu.

---

## 1. Koji problem ovo rešava

Pre faze 4 tok je bio:

1. Kupac (ili vlasnik) upiše porudžbinu. Status: `nova`.
2. Vlasnik gleda tablu, klikne kurira, otvori se WhatsApp, **on** pritisne Send.

Ako niko nije za tablom, porudžbina stoji. Klijent traži: slobodan kurir da
dobije ponudu **sam**, čim red uđe.

Dva ulaza i dalje pišu **istu** tabelu `orders`. Auto-dodela ne pita da li je
red sa sajta ili sa telefona — gleda samo „je li `nova` i bez kurira".

---

## 2. Šta smo odbacili i zašto

| Ideja | Zašto ne |
|---|---|
| TypeScript bira kurira (`select` pa `update`) | Dve porudžbine u istoj sekundi obe pročitaju „Kurir 1 je slobodan" i obe ga upišu. To je **trka**. Zaključavanje reda mora da uradi baza, u jednoj transakciji. |
| `AFTER INSERT` trigger na `orders` | Jedan mehanizam za svaki insert zvuči lepo, ali smo odlučili da se zove iz `create_web_order` — jasno se vidi u funkciji koju gost već sme da izvrši. Unos sa telefona još nema UI; kad dođe, ta funkcija mora **isto** da pozove dodelu. |
| Javni RPC (`GRANT` za `anon`) | Gost sa anon ključem bi mogao da zove `offer_order_to_next_courier` za tuđi `order_id` i da gurka dodelu. Zato `REVOKE ALL`. Gost sme samo `create_web_order`; ta funkcija je `security definer` pa **iznutra** sme da zove dodelu. |
| Aplikacija šalje Telegram već sad | Faza 5. Bez bota auto-dodela je samo red u bazi — i to je namerno, da se SQL prvo proveri. |
| Gasiti WhatsApp dugmad na tabli | Vlasnik zadržava ručnu rezervu. Auto-dodela **ne dira** red koji već ima kurira ili status koji nije `nova`. |

---

## 3. Pet odluka (da se ne nagađa)

1. Nova porudžbina sa sajta: `create_web_order` odmah posle `insert` zove
   `offer_order_to_next_courier`.
2. Kurir klikne „Ne mogu": **ta ista** porudžbina ide sledećem slobodnom. Sme
   da skoči ispred starijih u redu.
3. „Isporučeno" ili paljenje smene: **round-robin**. Sledeću `nova` dobija onaj
   ko je najduže bez ponude (`last_offer_at`), ne obavezno kurir koji se upravo
   oslobodio.
4. `offer_order_to_next_courier` i `drain_waiting_orders` nisu javni. Test iz
   SQL editora (kao postgres).
5. Admin WhatsApp dugmad ostaju.

---

## 4. Pojmovi običnim jezikom

**Trka.** Dva zahteva stignu u istoj sekundi. Oba pitaju „ko je slobodan?".
Bez zaključavanja, oba dobiju isti odgovor.

**`FOR UPDATE`.** „Zaključaj ovaj red dok ja ne završim transakciju." Drugi
`SELECT FOR UPDATE` na isti red **čeka**.

**`SKIP LOCKED`.** Umesto da čeka: „ovaj red neko već drži — preskoči ga i
uzmi sledeći." Zato druga porudžbina ne sedi i ne čeka Kurira 1, nego ide
Kuriru 2, ili ostane `nova` ako drugog nema.

**`security definer`.** Funkcija radi kao vlasnik tabele, ne kao onaj ko ju je
pozvao. Zato `create_web_order` (gost sme da je zove) može da upiše ponudu,
a gost **ne može** da zove `offer_order_to_next_courier` sam.

**Slobodan kurir.** `on_shift = true` **i** nema porudžbinu u `poslata_kuriru`
ili `krenuo`. Jedna vožnja u isto vreme. Nije bitno da li ima PIN ili Telegram
— to su druge faze.

**`last_offer_at`.** Kad je kurir poslednji put **dobio** ponudu, ne kad je
završio vožnju. `NULL` = još nikad, ide prvi (`NULLS FIRST`).

**`order_offers`.** Trag „kome smo šta nudili". Unique `(order_id, courier_id)`
znači: isti kurir **nikad** ne dobija istu porudžbinu ponovo. Odbio je —
preskačemo ga.

---

## 5. Dve funkcije

### `offer_order_to_next_courier(p_order_id)` — srce

Radi redom:

1. Zaključa **porudžbinu** (`FOR UPDATE`). Ako nije `nova` ili već ima
   `courier_id`, izlazi. To čuva ručnu WhatsApp dodelu i sprečava da dva
   poziva za **isti** red dodele dva kurira.
2. Traži kurira: na smeni, nije zauzet, nije već nudjen za ovaj `order_id`.
   Sort: `last_offer_at nulls first`, pa `id`. `FOR UPDATE SKIP LOCKED`.
3. Nema kandidata → porudžbina ostaje `nova`, funkcija vrati `null`.
4. Ima: status `poslata_kuriru`, upis `courier_id` i `assigned_at`, red u
   `order_offers` (`ponudjena`), `last_offer_at = now()`. Vrati `courier_id`.

Zaključaj **prvo porudžbinu, pa kurira**. Obrnuto: uzmeš kurira, pa otkriješ
da je porudžbina već dodeljena — moraš da ga „vratiš". Ovako je jednostavnije.

### `drain_waiting_orders()` — red čekanja

Kad se **oslobodi mesto** (isporučeno, ili kurir upali smenu), treba uzeti
najstariju `nova`.

Ne zove se `offer_order_to_next_courier` na slučajan red: ide `ORDER BY
created_at`. Ako najstariju niko slobodan ne može da uzme (svi slobodni su je
već odbili), ide na sledeću stariju — da red ne zapne zauvek na jednoj
odbijenoj.

Jedna uspešna ponuda i staje. Upravo se otvorilo jedno mesto (jedan kurir
slobodan); round-robin odlučuje **ko** od slobodnih je dobije.

---

## 6. Gde se pali

```
create_web_order          →  insert  →  offer_order_to_next_courier(novi id)
„Ne mogu"                 →  status nazad na nova  →  offer(ta ista)
„Isporučeno"              →  drain_waiting_orders()
smena ON                  →  drain_waiting_orders()
smena OFF                 →  ništa
```

`create_web_order` i dalje gostu vraća **samo** `P-17`. Gost ne vidi kog je
kurira baza izabrala. To je namerno: nema `select` policy za `anon`, a
`RETURNING` celog reda bi procurio `courier_token`.

---

## 7. Zašto gost sme `create_web_order`, a ne sme dodelu

Postgres na novu funkciju često da `EXECUTE` roli `PUBLIC`. Migracija to
skida (`REVOKE ALL`) i **ne** daje `GRANT` za `anon` ni `authenticated`.

`create_web_order` **ima** `GRANT` za `anon` — to je javna forma. Pošto je
`security definer`, telo funkcije radi kao vlasnik tabele. Vlasnik sme da
zove `offer_order_to_next_courier`. Gost preko HTTP-a vidi samo
`/rest/v1/rpc/create_web_order`.

Provera u SQL editoru:

```sql
set role anon;
select public.offer_order_to_next_courier('00000000-0000-0000-0000-000000000000');
-- mora da padne (permission denied)
reset role;
```

---

## 8. Trka na primeru

Jedan slobodan kurir. Dve porudžbine u istoj sekundi.

```
Tab A                         Tab B
create_web_order              create_web_order
  insert P-1                    insert P-2
  zaključa P-1                  zaključa P-2
  zaključa Kurira 1             Kurir 1 je locked → SKIP
  P-1 = poslata_kuriru          nema drugog slobodnog
                                P-2 ostaje nova
```

**Jedan SQL tab, dva poziva zaredom, nije trka.** Prvi se završi, pa drugi.
To samo dokazuje red čekanja (kurir je već zauzet). `SKIP LOCKED` vidiš samo
sa **dve konekcije** (dva taba), pokrenuta skoro istovremeno.

---

## 9. Kako testirati (SQL Editor)

Migraciju prvo nalepi / `db push`. Seed kuriri su `Kurir 1` i `Kurir 2`.

Reset pre vežbe:

```sql
update public.couriers
set last_offer_at = null, on_shift = true;
```

**Rotacija.** Dva slobodna, tri porudžbine zaredom:

```sql
select public.create_web_order('test-r1','Maxi','Ulica 1','0600000001','grad');
select public.create_web_order('test-r2','Maxi','Ulica 2','0600000002','grad');
select public.create_web_order('test-r3','Maxi','Ulica 3','0600000003','grad');

select public_number, status, courier_id
from public.orders
where title like 'test-r%'
order by created_at;
```

Očekivanje: prva i druga odu na dva različita kurira; treća ostane `nova`
(oba su zauzeta ponudom).

**Red čekanja.** Posle gornjeg, treća je `nova`. Kad jedan kurir završi vožnju
(prihvati pa `isporuceno`), `drain_waiting_orders` nudi tu treću — round-robin
bira ko je duže čekao ponudu.

**Odbijanje.** Kad postoji ponuda, `courier_respond_to_offer(sesija, order_id,
false)`: prvi ima `order_offers.outcome = odbijena`; ista porudžbina ide
drugom; prvom se **ne** nudi opet.

**Trka.** Jedan kurir `on_shift`, drugi `on_shift = false`. Dva taba, u istom
trenutku po jedan `create_web_order`. Tačno jedna `poslata_kuriru`, jedna
`nova`.

---

## 10. Šta ova faza namerno nije

- Telegram poruka kuriru (faza 5)
- istek ponude posle 3 minuta (faza 6)
- tabla: red čekanja, „Preotmi", „Poništi pristup" (faza 7)
- izmena `AGENTS.md` (faza 8)

Dok faza 5 ne stigne, kurir vidi ponudu tek kad osveži `/k/{token}`. To nije
bug faze 4 — faza 4 je samo baza.

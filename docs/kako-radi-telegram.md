# Kako radi Telegram (faza 5)

Uputstvo za fazu 5. Čitaj posle
[kako-radi-auto-dodela.md](kako-radi-auto-dodela.md) — tamo baza **bira** kurira.
Ovde ga **budi**: poruka stigne na telefon i kad je zaključan.

Izvor pravila: [featureKurir.md](featureKurir.md).

Bot API je **besplatan** (nema računa po poruci). Telegram Premium nije potreban.
Hosting (Vercel) je isti kao ostatak sajta — to nije Telegram naplata.

---

## 1. Koji problem ovo rešava

Faza 4 upiše `poslata_kuriru`. Kurir to ne vidi dok ne otvori `/k/...`.

`wa.me` ne može sam: otvori WhatsApp sa tekstom, ali **čovek** mora Send.
WhatsApp Cloud API je zabranjen u ovom projektu. Telegram bot šalje poruku
bez čoveka za tablom.

---

## 2. Dva odvojena posla

Ne mešaj ih.

**Povezivanje (jednom).** Kurir otvori
`https://t.me/IME_BOTA?start=ACCESS_TOKEN`. Telegram nam pošalje POST na
`/api/telegram/webhook`. Mi upišemo `couriers.telegram_chat_id`.

**Slanje ponude (svaki put).** Posle uspešnog `offer_order_to_next_courier`,
Next.js zove `sendOffer`. Tekst je isti kao WhatsApp
(`buildCourierMessage`), plus dugme ka `/k/{token}`. PIN **nije** u poruci.

---

## 3. Pojmovi običnim jezikom

**Webhook.** Mi damo Telegramu URL. Kad se desi događaj (kurir napiše
`/start ...`), **oni zovu nas**. Nije polling (ne pitamo Telegram u krug).

**Bot token.** Lozinka bota od [@BotFather](https://t.me/BotFather). Ko je ima,
šalje poruke u ime bota. Zato je u `.env.local`, **bez** `NEXT_PUBLIC_`, i
samo u server fajlovima ([lib/telegram.ts](../lib/telegram.ts), webhook).

**Secret zaglavlje.** `setWebhook` dobija `secret_token`. Telegram ga šalje kao
`X-Telegram-Bot-Api-Secret-Token`. Ako ga nema / nije isti, to nije Telegram
nego neko ko pogađa URL.

**Service role.** Anon ključ ne sme da čita porudžbine ni `telegram_chat_id`.
Posle dodele server ipak mora da vidi kome da pošalje — zato
[lib/supabase/admin.ts](../lib/supabase/admin.ts), samo na serveru.

---

## 4. Zašto token nije u browseru

`NEXT_PUBLIC_` u Next-u znači: ugradi vrednost u JavaScript koji ide korisniku.
View Source bi pokazao token. Zato bot token, webhook secret i service role
**nemaju** taj prefiks.

Jedini javni URL u poruci je `NEXT_PUBLIC_SITE_URL` — to je adresa sajta, nije
tajna.

---

## 5. Zašto localhost ne prima webhook

Telegram mora da pogodi **javni HTTPS**. `http://localhost:3000` nije na
internetu.

- **Slanje** (`sendMessage`) radi i sa `next dev` — to je odlazni poziv ka
  `api.telegram.org`.
- **Povezivanje** (`/start`) treba deployed sajt (Vercel) ili privremeni tunel.

Za vežbu sme i SQL:

```sql
update public.couriers
set telegram_chat_id = 123456789
where name = 'Kurir 1';
```

Broj vidiš kad webhook u produkciji upiše red, ili iz Telegram `chat.id`.

---

## 6. Gde se šalje ponuda

Baza i dalje bira kurira. Next.js šalje **posle** RPC-a:

| Šta se desilo | Ko zove sendOffer |
|---|---|
| Nova porudžbina sa sajta | [create-guest-order.ts](../app/actions/create-guest-order.ts) — traži red po `P-17` |
| „Ne mogu" | [courier.ts](../app/actions/courier.ts) — SQL vrati `offered_courier_id` |
| „Isporučeno" | isto (`drain_waiting_orders`) |
| Smena ON | isto |
| Prihvati / smena OFF | ne šalje |

Ako nema `telegram_chat_id` ili nema tokena: samo log. Porudžbina ostaje.
Gost i dalje dobije broj.

SQL editor ne šalje Telegram — nema Next.js u tom putu.

---

## 7. Podešavanje

1. [@BotFather](https://t.me/BotFather) → New Bot → token u `.env.local` i
   Vercel env (`TELEGRAM_BOT_TOKEN`).
2. `TELEGRAM_BOT_USERNAME` = ime bota bez `@`.
3. `TELEGRAM_WEBHOOK_SECRET` = dugačak nasumičan string.
4. `SUPABASE_SERVICE_ROLE_KEY` iz Supabase (Settings → API). Nikad u git.
5. Kad sajt ima HTTPS:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://TVOJ_SAJT/api/telegram/webhook&secret_token=<SECRET>
```

SQL iz
[supabase/migrations/20260831150000_telegram_offer_notify.sql](../supabase/migrations/20260831150000_telegram_offer_notify.sql)
nalepi u Supabase (kao i prethodne faze).

---

## 8. Kako testirati

1. Nalepi SQL migraciju. Popuni env. Restart `next dev`.
2. Uloguj se kao kurir → „Otvori bota" (na deployed URL-u, ili upiši
   `telegram_chat_id` ručno).
3. Osveži `/k/...` — banner „Poveži Telegram" nestane.
4. Kurir na smeni, slobodan. Nova porudžbina sa sajta → poruka na Telegramu,
   dugme otvara `/k/...`.
5. „Ne mogu" → poruka **drugom** kuriru.
6. Isključi `TELEGRAM_BOT_TOKEN` privremeno: porudžbina i dalje uspe, hvala
   stranica radi.

---

## 9. Šta ova faza namerno nije

- Istek ponude posle 3 minuta (faza 6)
- Tabla: red čekanja, „Preotmi" (faza 7)
- Izmena `AGENTS.md` (faza 8)

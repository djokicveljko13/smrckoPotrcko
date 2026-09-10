# Resend — upiti za saradnju

Forma `/saradnja` poziva `submitPartnership`, koji proverava podatke i šalje
tekstualni mejl preko `sendPartnershipEmail`. Upit se ne upisuje u bazu.
Ovo ne uključuje obaveštenja za porudžbine.

## Podešavanje

1. Napravi Resend nalog i u API Keys napravi ključ sa dozvolom za slanje.
2. U postojeći `.env.local` dodaj sledeće promenljive (ne prepisuj ostatak fajla):

```dotenv
RESEND_API_KEY=ovde_unesi_svoj_kljuc
PARTNERSHIP_EMAIL_TO=potrckosmrcko@gmail.com
```

`EMAIL_FROM` je opciono za početni test: podrazumevano je
`Šmrčko Potrčko <onboarding@resend.dev>`. Kada je primalac jednom podešen,
ostaje samo unos `RESEND_API_KEY`.

Ključ se ne šalje u razgovor i ne ide na Git. Nijedna od ovih promenljivih
ne sme imati prefiks `NEXT_PUBLIC_`.

3. Restartuj lokalni server nakon izmene `.env.local`.
4. Za slanje vlasniku na drugu adresu dodaj svoj domen u Resend → Domains,
   unesi DNS zapise koje Resend prikaže kod provajdera domena i sačekaj
   verifikaciju. DNS zapisi dokazuju da smeš da šalješ mejlove sa tog domena.
5. Promeni `EMAIL_FROM` na adresu sa verifikovanog domena, a
   `PARTNERSHIP_EMAIL_TO` na vlasnikovo sanduče.
6. Za objavljen sajt postavi iste tri promenljive u Vercel podešavanjima
   projekta i napravi novi deployment.

## Ponašanje i provera

- Naziv firme je obavezan, do 200 znakova; telefon 6–40; poruka opciona, do 1000.
- Dok slanje traje, polja i dugme su zaključani.
- Resend mora vratiti uspešan odgovor sa ID-jem mejla da bi se prikazala potvrda.
  To znači da je prihvatio mejl za slanje; isporuku proveri u Resend evidenciji.
- Bez konfiguracije, pri odbijanju ili prekidu veze prikazuje se greška i broj
  za poziv; unos ostaje. Nema lažne lokalne potvrde niti ispisa upita u log.
- Skriveno `website` polje odbacuje jednostavne botove; nije potpuna zaštita od spama.
- Ručno proveri neispravan unos, grešku bez konfiguracije i uspeh sa svojim
  test podacima. Proveri sanduče i Resend evidenciju; ne šalji stvarne upite kao test.

Dokumentacija: [Slanje mejla](https://resend.com/docs/api-reference/emails/send-email),
[ograničenje test domena](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

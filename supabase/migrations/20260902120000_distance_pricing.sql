-- Faza 2 (feature cena po km): cena dostave se sada RAČUNA i ČUVA.
--
-- Izvor istine za pravila: docs/featureGoogleMaps.md.
--
-- Ključna promena bezbednosti: guest browser (anon ključ, javan) više NE piše
-- u `orders` ni na jedan način. Gost šalje formu našem serveru; server pozove
-- Google, izračuna cenu i upiše red service_role ključem koji nikad ne napušta
-- server. Da smo samo dodali `p_delivery_price` u anon-funkciju, svako sa
-- interneta bi mogao da naruči dostavu za 0 dinara (`curl` + javni anon ključ).

-- ---------------------------------------------------------------------------
-- 1. Nove kolone
-- ---------------------------------------------------------------------------
alter table public.orders
  add column distance_m integer,
  add column destination_place_id text;

-- `zone` je gost dosad sam birao u formi. Sad je nema u formi (cena zavisi od
-- kilometraže, ne od zone). Kolona ostaje zbog starih redova, samo se više ne
-- popunjava — zato pada `not null`.
alter table public.orders alter column zone drop not null;

-- ---------------------------------------------------------------------------
-- 2. Trigger: dozvoli service_role da zadrži upisanu cenu
-- ---------------------------------------------------------------------------
-- Dosad je trigger brisao `delivery_price` svakome ko nije 'authenticated'
-- (20260830173000_fix_guest_order_defaults.sql). Naš server piše kao
-- 'service_role', pa mu moramo dozvoliti da cena preživi INSERT.
-- `is distinct from` je null-safe: kad auth.role() vrati NULL (pravi gost),
-- oba uslova su tačna i red se i dalje sanira.
create or replace function public.set_order_defaults()
returns trigger
language plpgsql
as $$
begin
  new.public_number := 'P-' || nextval('public.order_public_number_seq')::text;
  new.courier_token := encode(extensions.gen_random_bytes(32), 'hex');
  new.updated_at := now();

  if auth.role() is distinct from 'authenticated'
     and auth.role() is distinct from 'service_role' then
    new.source := 'sajt';
    new.status := 'nova';
    new.courier_id := null;
    new.assigned_at := null;
    new.delivery_price := null;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. `create_web_order`: nova lista parametara, grant sa anon na service_role
-- ---------------------------------------------------------------------------
-- Promena parametara ne prolazi kroz `create or replace` — mora drop pa create.
drop function if exists public.create_web_order(text, text, text, text, public.order_zone);

create function public.create_web_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_distance_m integer,
  p_place_id text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  insert into public.orders (
    title,
    shop,
    address,
    phone,
    source,
    delivery_price,
    distance_m,
    destination_place_id
  )
  values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    'sajt',
    p_delivery_price,   -- već izračunato na serveru; NULL ako je Google zakazao
    p_distance_m,
    nullif(trim(p_place_id), '')
  )
  returning id, public_number into v_id, v_number;

  perform public.offer_order_to_next_courier(v_id);

  return v_number;
end;
$$;

-- "public" bi obuhvatio i anon i authenticated. Skidamo sve, dajemo samo serveru.
revoke all on function public.create_web_order(text, text, text, text, numeric, integer, text) from public;
grant execute on function public.create_web_order(text, text, text, text, numeric, integer, text) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Ukini anon INSERT polisu
-- ---------------------------------------------------------------------------
-- Bez ovoga ostaje rupa: RPC je zatvoren, ali direktan `POST /rest/v1/orders`
-- anon ključem bi i dalje prošao — red bez cene, bez ponude kuriru.
drop policy if exists orders_anon_insert_web on public.orders;

-- ---------------------------------------------------------------------------
-- 5. `owner_set_delivery_price`: vlasnik ručno upiše cenu KAD NEDOSTAJE
-- ---------------------------------------------------------------------------
-- Dogovor: nema prepravke već izračunate cene (nema popusta). Pravilo mora da
-- stoji u bazi — `where delivery_price is null`. Ako vlasnik pokuša da izmeni
-- cenu koja već postoji, UPDATE ne pogodi nijedan red i vraća se 'not_editable'.
create or replace function public.owner_set_delivery_price(
  p_order_id uuid,
  p_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_price is null or p_price <= 0 then
    return jsonb_build_object('ok', false, 'error', 'bad_price');
  end if;

  update public.orders
  set delivery_price = p_price
  where id = p_order_id
    and delivery_price is null;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_editable');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.owner_set_delivery_price(uuid, numeric) from public;
grant execute on function public.owner_set_delivery_price(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. `courier_job_json`: dodaj cenu i razdaljinu
-- ---------------------------------------------------------------------------
-- `zone` ostaje zasad kao most — kurirska strana (job-details.tsx) i tip
-- CourierJob je još čitaju. Skida se u Fazi 5 zajedno sa TS izmenama.
create or replace function public.courier_job_json(
  o public.orders,
  p_offered_at timestamptz
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'id', o.id,
    'public_number', o.public_number,
    'title', o.title,
    'shop', o.shop,
    'address', o.address,
    'phone', o.phone,
    'zone', o.zone,
    'delivery_price', o.delivery_price,
    'distance_m', o.distance_m,
    'status', o.status,
    'offered_at', p_offered_at
  );
$$;

revoke all on function public.courier_job_json(public.orders, timestamptz) from public;

-- ---------------------------------------------------------------------------
-- Provera prava (SQL Editor). Oba moraju da vrate permission denied / 42501:
--   set role anon;
--   select public.create_web_order('x','x','x','0600000000', 300, 4200, null);
--   insert into public.orders (title, shop, address, phone, source)
--     values ('x','x','x','060', 'sajt');
--   reset role;
-- ---------------------------------------------------------------------------

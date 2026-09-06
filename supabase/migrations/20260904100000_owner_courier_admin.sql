-- Vlasnik vodi kurire sam, sa table. Do sada se kurir dodavao INSERT-om u SQL
-- editoru, a PIN je kovala mint_courier_pin. Sada vlasnik upisuje svoj PIN.
--
-- Zasto funkcije, kad RLS vec dozvoljava insert ulogovanom vlasniku:
--   1. PIN sme da se heshira samo u bazi (extensions.crypt). Iz browsera bi
--      morao da putuje kao tekst do necega sto ga heshira.
--   2. Gasenje kurira je vise izmena odjednom (is_active, on_shift, sesije,
--      otvorena ponuda). U funkciji je to jedna transakcija: sve ili nista.
--
-- Sve owner_* funkcije su security definer i dostupne SAMO roli authenticated.
-- Vidi docs/featureAdmin.md, Faza 2.
--
-- PAZNJA na grantove - potrebna su DVA revoke-a, ne jedan:
--   from public  -> Postgres SVAKOJ novoj funkciji podrazumevano da EXECUTE
--                   roli PUBLIC, a anon to nasledjuje.
--   from anon    -> Supabase uz to ima ALTER DEFAULT PRIVILEGES koji daje
--                   EXECUTE direktno rolama anon i authenticated.
-- Ako fali bilo koji, has_function_privilege('anon', ...) ostaje true.

-- Ugasen kurir ostaje u bazi zbog istorije starih porudzbina; samo vise ne moze
-- da se prijavi i ne ulazi u rotaciju. Zato is_active, a ne DELETE.
alter table public.couriers
  add column if not exists is_active boolean not null default true;

create or replace function public.owner_create_courier(
  p_name text,
  p_phone text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_id uuid;
  v_token text;
begin
  if v_name = '' or v_phone = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;

  -- 4-8 cifara: vlasnik bira PIN i diktira ga kuriru, pa mora da se pamti.
  if p_pin is null or p_pin !~ '^[0-9]{4,8}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_pin');
  end if;

  -- access_token pravi DEFAULT kolone (32 nasumicna bajta), ne mi ovde.
  insert into public.couriers (name, phone, pin_hash)
  values (
    v_name,
    v_phone,
    extensions.crypt(p_pin, extensions.gen_salt('bf', 10))
  )
  returning id, access_token into v_id, v_token;

  return jsonb_build_object('ok', true, 'id', v_id, 'access_token', v_token);
end;
$$;

revoke execute on function public.owner_create_courier(text, text, text) from public;
revoke execute on function public.owner_create_courier(text, text, text) from anon;
grant execute on function public.owner_create_courier(text, text, text) to authenticated;

-- Kurir je zaboravio PIN ili ga je neko cuo. Usput otkljucava kurira koji je
-- zakljucan sa 5 promasaja, da vlasnik ne mora da ceka 15 minuta.
create or replace function public.owner_set_courier_pin(
  p_courier_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,8}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_pin');
  end if;

  update public.couriers
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
      pin_failed_count = 0,
      pin_locked_until = null
  where id = p_courier_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.owner_set_courier_pin(uuid, text) from public;
revoke execute on function public.owner_set_courier_pin(uuid, text) from anon;
grant execute on function public.owner_set_courier_pin(uuid, text) to authenticated;

-- Ispravka greske u kucanju ili promena broja. PIN i token se ovde ne diraju.
create or replace function public.owner_update_courier(
  p_courier_id uuid,
  p_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
begin
  if v_name = '' or v_phone = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;

  update public.couriers
  set name = v_name,
      phone = v_phone
  where id = p_courier_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.owner_update_courier(uuid, text, text) from public;
revoke execute on function public.owner_update_courier(uuid, text, text) from anon;
grant execute on function public.owner_update_courier(uuid, text, text) to authenticated;

-- Gasenje kurira je vise koraka koji moraju da prodju zajedno:
--   is_active + on_shift, brisanje sesija (trenutno izbacivanje), i vracanje
--   otvorene ponude u red da porudzbina ne ostane zakacena za ugasenog coveka.
-- Vozju u toku (krenuo) NE diramo - kupac ceka, kurir je na putu.
create or replace function public.owner_set_courier_active(
  p_courier_id uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if not exists (select 1 from public.couriers where id = p_courier_id) then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  if p_active then
    update public.couriers
    set is_active = true
    where id = p_courier_id;

    -- Smenu kurir pali sam sa svoje stranice, zato on_shift ostaje false.
    return jsonb_build_object('ok', true, 'is_active', true);
  end if;

  if exists (
    select 1 from public.orders
    where courier_id = p_courier_id
      and status = 'krenuo'
  ) then
    return jsonb_build_object('ok', false, 'error', 'on_ride');
  end if;

  update public.couriers
  set is_active = false,
      on_shift = false
  where id = p_courier_id;

  -- Sesija je red u tabeli bas zato da bi ovo bilo moguce: bez ovog DELETE-a
  -- bi ugasen kurir i dalje radio na svojoj stranici do isteka od 12h.
  delete from public.courier_sessions
  where courier_id = p_courier_id;

  -- Otvorena ponuda: oznaci je kao propalu i vrati porudzbinu u red.
  -- 'istekla' (ne 'odbijena') jer kurir nije odbio - vlasnik ga je ugasio.
  -- Red u order_offers ostaje, pa mu se ista porudzbina nece ponovo nuditi.
  for v_order_id in
    select id from public.orders
    where courier_id = p_courier_id
      and status = 'poslata_kuriru'
  loop
    update public.order_offers
    set outcome = 'istekla',
        responded_at = now()
    where order_id = v_order_id
      and courier_id = p_courier_id
      and outcome = 'ponudjena';

    update public.orders
    set status = 'nova',
        courier_id = null,
        assigned_at = null
    where id = v_order_id;

    perform public.offer_order_to_next_courier(v_order_id);
  end loop;

  return jsonb_build_object('ok', true, 'is_active', false);
end;
$$;

revoke execute on function public.owner_set_courier_active(uuid, boolean) from public;
revoke execute on function public.owner_set_courier_active(uuid, boolean) from anon;
grant execute on function public.owner_set_courier_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Postojece funkcije moraju da nauce za is_active i za PIN od 4-8 cifara.
-- create or replace zadrzava vec dodeljena prava; revoke/grant ponavljamo
-- svejedno, da fajl bude tacan i kad se pokrene na praznoj bazi.
-- ---------------------------------------------------------------------------

-- Ugasen kurir: link vise ne postoji (page.tsx zove notFound kad nema imena).
create or replace function public.courier_peek(p_access_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select c.name into v_name
  from public.couriers c
  where c.access_token = p_access_token
    and c.is_active;

  return v_name;
end;
$$;

revoke execute on function public.courier_peek(text) from public;
grant execute on function public.courier_peek(text) to anon, authenticated;

-- Izmene u odnosu na 20260831120000: PIN je 4-8 cifara i ugasen kurir ne ulazi.
create or replace function public.courier_login(
  p_access_token text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier public.couriers%rowtype;
  v_fails integer;
  v_session text;
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,8}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_pin');
  end if;

  select * into v_courier
  from public.couriers
  where access_token = p_access_token;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;

  -- Provera ide pre PIN-a: ugasenom kuriru ni tacan PIN ne pomaze.
  if not v_courier.is_active then
    return jsonb_build_object('ok', false, 'error', 'inactive');
  end if;

  if v_courier.pin_hash is null then
    return jsonb_build_object('ok', false, 'error', 'no_pin');
  end if;

  if v_courier.pin_locked_until is not null
     and v_courier.pin_locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  if extensions.crypt(p_pin, v_courier.pin_hash) = v_courier.pin_hash then
    update public.couriers
    set pin_failed_count = 0,
        pin_locked_until = null
    where id = v_courier.id;

    v_session := encode(extensions.gen_random_bytes(32), 'hex');

    insert into public.courier_sessions (token, courier_id, expires_at)
    values (v_session, v_courier.id, now() + interval '12 hours');

    return jsonb_build_object('ok', true, 'session_token', v_session);
  end if;

  v_fails := v_courier.pin_failed_count + 1;

  if v_fails >= 5 then
    update public.couriers
    set pin_failed_count = v_fails,
        pin_locked_until = now() + interval '15 minutes'
    where id = v_courier.id;

    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  update public.couriers
  set pin_failed_count = v_fails
  where id = v_courier.id;

  return jsonb_build_object('ok', false, 'error', 'bad_pin');
end;
$$;

revoke execute on function public.courier_login(text, text) from public;
grant execute on function public.courier_login(text, text) to anon, authenticated;

-- Jedina izmena u odnosu na 20260831140000: `and c.is_active` u izboru kurira.
-- Ugasen kurir ne sme da udje u rotaciju cak i ako mu je on_shift ostao true.
create or replace function public.offer_order_to_next_courier(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_courier_id uuid;
begin
  if p_order_id is null then
    return null;
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.status is distinct from 'nova' or v_order.courier_id is not null then
    return null;
  end if;

  select c.id into v_courier_id
  from public.couriers c
  where c.on_shift
    and c.is_active
    and not exists (
      select 1
      from public.orders o
      where o.courier_id = c.id
        and o.status in ('poslata_kuriru', 'krenuo')
    )
    and not exists (
      select 1
      from public.order_offers f
      where f.order_id = p_order_id
        and f.courier_id = c.id
    )
  order by c.last_offer_at nulls first, c.id
  limit 1
  for update of c skip locked;

  if v_courier_id is null then
    return null;
  end if;

  update public.orders
  set courier_id = v_courier_id,
      status = 'poslata_kuriru',
      assigned_at = now()
  where id = p_order_id;

  insert into public.order_offers (order_id, courier_id)
  values (p_order_id, v_courier_id);

  update public.couriers
  set last_offer_at = now()
  where id = v_courier_id;

  return v_courier_id;
end;
$$;

revoke all on function public.offer_order_to_next_courier(uuid) from public;
revoke all on function public.offer_order_to_next_courier(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor, kao postgres).
--
-- 1) Prava: prvo mora FALSE, drugo TRUE.
--   select has_function_privilege('anon','public.owner_create_courier(text,text,text)','execute');
--   select has_function_privilege('authenticated','public.owner_create_courier(text,text,text)','execute');
--   select has_function_privilege('anon','public.owner_set_courier_active(uuid,boolean)','execute');
--   select has_function_privilege('authenticated','public.owner_set_courier_active(uuid,boolean)','execute');
--
-- 2) Novi kurir sa 4-cifrenim PIN-om (vrati id i access_token):
--   select public.owner_create_courier('Test Kurir', '0600000000', '1234');
--
-- 3) Lose vrednosti moraju da vrate ok=false, ne da puknu:
--   select public.owner_create_courier('', '0600000000', '1234');   -- missing_fields
--   select public.owner_create_courier('X', '060', '12');           -- bad_pin
--   select public.owner_set_courier_pin('00000000-0000-0000-0000-000000000000', '1234'); -- unknown_courier
--
-- 4) Gasenje kurira kome je poslata ponuda:
--   -- nadji ga:  select id, name from public.couriers where is_active;
--   select public.owner_set_courier_active('<id>', false);
--   -- ocekivano: njegova porudzbina je opet nova (ili odmah poslata_kuriru
--   -- drugom kuriru), u order_offers stoji 'istekla', sesije su obrisane:
--   select status, courier_id from public.orders where id = '<order_id>';
--   select outcome from public.order_offers where courier_id = '<id>';
--   select count(*) from public.courier_sessions where courier_id = '<id>';  -- 0
--
-- 5) Kurir na vozji se ne gasi:
--   -- dok mu je porudzbina u statusu 'krenuo':
--   select public.owner_set_courier_active('<id>', false);  -- ok=false, on_ride
--
-- 6) Ugasen kurir ne moze da se prijavi ni sa tacnim PIN-om:
--   select public.courier_login('<access_token>', '1234');  -- ok=false, inactive
--   select public.courier_peek('<access_token>');           -- null
-- ---------------------------------------------------------------------------

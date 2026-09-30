-- Jednokratna ponuda (AGENTS.md, "Cena i potvrda javne porudžbine").
--
-- Problem: potpisana ponuda važi 15 minuta, ali niko ne pamti da je već
-- iskorišćena. Isti token poslat 50 puta = 50 porudžbina i 50 Telegram poruka.
--
-- Rešenje: server u svaku ponudu upiše nasumičan UUID. Upis ga čuva u
-- orders.quote_id, koji je UNIQUE. Drugi upis iste ponude baza odbije sama —
-- i kad dva zahteva stignu u istoj milisekundi, što "prvo SELECT pa INSERT"
-- ne bi uhvatio.
--
-- Redosled objave: ova migracija DODAJE nove verzije funkcija (sa p_quote_id)
-- i ne dira stare, pa sajt radi i pre i posle deploy-a novog koda. Stare
-- verzije briše 20260930140000_drop_old_order_rpcs.sql, POSLE deploy-a.

-- ---------------------------------------------------------------------------
-- 1. Kolona
-- ---------------------------------------------------------------------------
-- Postgres u UNIQUE koloni dozvoljava više NULL vrednosti, pa stari redovi
-- (bez ponude) ne smetaju.
alter table public.orders
  add column if not exists quote_id uuid unique;

-- ---------------------------------------------------------------------------
-- 2. create_web_order sa p_quote_id
-- ---------------------------------------------------------------------------
-- Vraća jsonb umesto teksta: server mora da zna da li je red NOV (pa šalje
-- Telegram) ili je ista ponuda već upisana (isti broj, bez nove poruke).
--
-- `on conflict (quote_id) do nothing` = ako quote_id već postoji, ne upisuj
-- i ne bacaj grešku; `returning ... into` tada ostavi promenljive NULL.
-- Napomena: BEFORE trigger ipak uzme sledeći broj iz sekvence, pa ponovljena
-- ponuda ostavi rupu u P-brojevima. Brojevi nisu tajna ni račun, to je u redu.
create function public.create_web_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_distance_m integer,
  p_place_id text,
  p_note text,
  p_quote_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if p_quote_id is null then
    raise exception 'quote id is required';
  end if;

  insert into public.orders (
    title,
    shop,
    address,
    phone,
    source,
    delivery_price,
    distance_m,
    destination_place_id,
    shopping_note,
    quote_id
  )
  values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    'sajt',
    p_delivery_price,
    p_distance_m,
    nullif(trim(p_place_id), ''),
    nullif(trim(p_note), ''),
    p_quote_id
  )
  on conflict (quote_id) do nothing
  returning id, public_number into v_id, v_number;

  if v_id is null then
    select o.public_number into v_number
    from public.orders o
    where o.quote_id = p_quote_id;

    return jsonb_build_object('public_number', v_number, 'created', false);
  end if;

  perform public.offer_order_to_next_courier(v_id);

  return jsonb_build_object('public_number', v_number, 'created', true);
end;
$$;

revoke all on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text, uuid
) from public;
revoke execute on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text, uuid
) from anon, authenticated;
grant execute on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text, uuid
) to service_role;

-- ---------------------------------------------------------------------------
-- 3. create_phone_order sa p_quote_id (isti potpisani tok, izvor telefon)
-- ---------------------------------------------------------------------------
create function public.create_phone_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_distance_m integer,
  p_place_id text,
  p_note text,
  p_quote_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if p_quote_id is null then
    raise exception 'quote id is required';
  end if;

  insert into public.orders (
    title,
    shop,
    address,
    phone,
    source,
    delivery_price,
    distance_m,
    destination_place_id,
    shopping_note,
    quote_id
  )
  values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    'telefon',
    p_delivery_price,
    p_distance_m,
    nullif(trim(p_place_id), ''),
    nullif(trim(p_note), ''),
    p_quote_id
  )
  on conflict (quote_id) do nothing
  returning id, public_number into v_id, v_number;

  if v_id is null then
    select o.public_number into v_number
    from public.orders o
    where o.quote_id = p_quote_id;

    return jsonb_build_object('public_number', v_number, 'created', false);
  end if;

  perform public.offer_order_to_next_courier(v_id);

  return jsonb_build_object('public_number', v_number, 'created', true);
end;
$$;

revoke all on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text, uuid
) from public;
revoke execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text, uuid
) from anon, authenticated;
grant execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text, uuid
) to service_role;

-- ---------------------------------------------------------------------------
-- 4. create_shopping_order sa p_quote_id
-- ---------------------------------------------------------------------------
-- Stavke liste se upisuju samo kad je red nov; ponovljena ponuda ne duplira listu.
create function public.create_shopping_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_place_id text,
  p_note text,
  p_items text[],
  p_quote_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if p_quote_id is null then
    raise exception 'quote id is required';
  end if;

  if coalesce(array_length(p_items, 1), 0) not between 1 and 30 then
    raise exception 'shopping list must have 1..30 items';
  end if;

  insert into public.orders (
    title,
    shop,
    address,
    phone,
    source,
    order_type,
    delivery_price,
    destination_place_id,
    shopping_note,
    quote_id
  ) values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    'sajt',
    'kupovina',
    p_delivery_price,
    nullif(trim(p_place_id), ''),
    nullif(trim(p_note), ''),
    p_quote_id
  )
  on conflict (quote_id) do nothing
  returning id, public_number into v_id, v_number;

  if v_id is null then
    select o.public_number into v_number
    from public.orders o
    where o.quote_id = p_quote_id;

    return jsonb_build_object('public_number', v_number, 'created', false);
  end if;

  insert into public.shopping_items (order_id, sort_order, text)
  select v_id, ord::integer, trim(t)
  from unnest(p_items) with ordinality as u(t, ord)
  where char_length(trim(t)) > 0;

  perform public.offer_order_to_next_courier(v_id);

  return jsonb_build_object('public_number', v_number, 'created', true);
end;
$$;

revoke all on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[], uuid
) from public;
revoke execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[], uuid
) from anon, authenticated;
grant execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[], uuid
) to service_role;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor, kao postgres).
--
-- 1) Prava — sva tri FALSE:
--   select has_function_privilege('anon', 'public.create_web_order(text,text,text,text,numeric,integer,text,text,uuid)', 'execute');
--   select has_function_privilege('anon', 'public.create_phone_order(text,text,text,text,numeric,integer,text,text,uuid)', 'execute');
--   select has_function_privilege('anon', 'public.create_shopping_order(text,text,text,text,numeric,text,text,text[],uuid)', 'execute');
--
-- 2) Ista ponuda dvaput — prvi created=true, drugi created=false i ISTI broj.
--    Blok namerno završava sa RAISE EXCEPTION: greška poništi sve što je
--    blok uradio, pa test red ne ostaje u bazi ni dodeljen pravom kuriru.
--    Rezultat čitaš iz poruke greške.
--   do $$
--   declare a jsonb; b jsonb; n bigint;
--   begin
--     a := public.create_web_order('TEST replay','x','x','0600000000',100,1000,null,null,'11111111-1111-1111-1111-111111111111');
--     b := public.create_web_order('TEST replay','x','x','0600000000',100,1000,null,null,'11111111-1111-1111-1111-111111111111');
--     select count(*) into n from public.orders where quote_id = '11111111-1111-1111-1111-111111111111';
--     raise exception 'TEST (sve je ponisteno): prvi=% drugi=% redova=%', a, b, n;
--   end $$;
--   -- očekivano: prvi created=true, drugi created=false sa istim brojem, redova=1
-- ---------------------------------------------------------------------------

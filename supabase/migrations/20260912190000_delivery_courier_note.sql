-- Napomena za Potrčka na običnoj dostavi (sajt + telefon).
-- Kolona shopping_note već postoji od kupovine; sada je pune i ova dva RPC-a.
-- Promena liste parametara = drop pa create.

drop function if exists public.create_web_order(text, text, text, text, numeric, integer, text);

create function public.create_web_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_distance_m integer,
  p_place_id text,
  p_note text
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
    destination_place_id,
    shopping_note
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
    nullif(trim(p_note), '')
  )
  returning id, public_number into v_id, v_number;

  perform public.offer_order_to_next_courier(v_id);

  return v_number;
end;
$$;

revoke all on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text
) from public;
revoke execute on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text
) from anon, authenticated;
grant execute on function public.create_web_order(
  text, text, text, text, numeric, integer, text, text
) to service_role;

drop function if exists public.create_phone_order(text, text, text, text, numeric, integer, text);

create function public.create_phone_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_distance_m integer,
  p_place_id text,
  p_note text
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
    destination_place_id,
    shopping_note
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
    nullif(trim(p_note), '')
  )
  returning id, public_number into v_id, v_number;

  perform public.offer_order_to_next_courier(v_id);

  return v_number;
end;
$$;

revoke all on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text
) from public;
revoke execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text
) from anon, authenticated;
grant execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text, text
) to service_role;

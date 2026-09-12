-- Unos sa poziva (AGENTS.md tok B): ista porudžbina kao sa sajta, izvor telefon.
-- Cenu računa naš server; ova funkcija samo upisuje red i zove auto-dodelu.
-- Grant samo service_role — authenticated ne sme da pošalje cenu iz browsera.

create function public.create_phone_order(
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
    'telefon',
    p_delivery_price,
    p_distance_m,
    nullif(trim(p_place_id), '')
  )
  returning id, public_number into v_id, v_number;

  perform public.offer_order_to_next_courier(v_id);

  return v_number;
end;
$$;

revoke all on function public.create_phone_order(
  text, text, text, text, numeric, integer, text
) from public;
revoke execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text
) from anon, authenticated;
grant execute on function public.create_phone_order(
  text, text, text, text, numeric, integer, text
) to service_role;

-- Guest insert cannot use RETURNING / .select(): there is no SELECT policy for anon.
-- This function writes the row and returns only the public ticket number (not courier_token).

create or replace function public.create_web_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_zone public.order_zone
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
begin
  insert into public.orders (
    title,
    shop,
    address,
    phone,
    zone,
    source
  )
  values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    p_zone,
    'sajt'
  )
  returning public_number into v_number;

  return v_number;
end;
$$;

revoke all on function public.create_web_order(text, text, text, text, public.order_zone) from public;
grant execute on function public.create_web_order(text, text, text, text, public.order_zone) to anon;

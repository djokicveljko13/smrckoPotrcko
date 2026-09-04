-- Čišćenje posle feature "cena po km" (Faza 5).
-- courier_job_json je privremeno vraćao i `zone` (most dok TS nije prešao na
-- delivery_price / distance_m). Kod je više ne čita — izbacujemo je.

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
    'delivery_price', o.delivery_price,
    'distance_m', o.distance_m,
    'status', o.status,
    'offered_at', p_offered_at
  );
$$;

revoke all on function public.courier_job_json(public.orders, timestamptz) from public;

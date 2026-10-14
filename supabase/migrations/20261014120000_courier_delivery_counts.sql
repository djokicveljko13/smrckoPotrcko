-- Broj isporuka po kuriru (danas i ukupno) za /admin/kuriri.
-- Broji iz orders, nema posebne tabele: jedan izvor istine.
--
-- security_invoker: view cita sa pravima onoga ko pita, pa vaze RLS pravila
-- tabele orders. Bez toga bi radio kao vlasnik view-a (postgres) i zaobisao RLS.
--
-- "Danas" = updated_at po Beogradu, isto kao "danas isporuceno" na kurirskoj
-- strani. Obrisan kurir ostavlja courier_id = NULL, pa ispada iz brojanja.
create view public.courier_delivery_counts
with (security_invoker = true)
as
select
  courier_id,
  count(*) as total,
  count(*) filter (
    where timezone('Europe/Belgrade', updated_at)::date
        = timezone('Europe/Belgrade', now())::date
  ) as today
from public.orders
where status = 'isporuceno'
  and courier_id is not null
group by courier_id;

-- Supabase daje pravo citanja i gostu; cita samo vlasnik.
revoke all on public.courier_delivery_counts from public, anon;
grant select on public.courier_delivery_counts to authenticated;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor):
--   select * from public.courier_delivery_counts;
--   select has_table_privilege('anon', 'public.courier_delivery_counts', 'select');  -- false

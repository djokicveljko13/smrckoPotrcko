-- Vlasnik sme da OBRISE kurira, ne samo da ga ugasi.
--
-- Cena te odluke, svesno prihvacena: stare porudzbine tog kurira ostaju bez
-- imena. Na pitanje "ko je vozio P-17?" posle brisanja nema odgovora.
-- Zato je "Ugasi" i dalje preporucen potez, a brisanje je za ciscenje.
--
-- Zasto se strani kljuc pravi iznova: pravilo "sta sa redovima koji pokazuju
-- na obrisani red" zivi u samom ogranicenju. Postojece je napravljeno bez
-- `on delete`, pa vazi podrazumevano NO ACTION (= zabrani brisanje). To se ne
-- menja u mestu — ogranicenje se drop-uje pa dodaje ponovo.

alter table public.orders
  drop constraint if exists orders_courier_id_fkey;

alter table public.orders
  add constraint orders_courier_id_fkey
  foreign key (courier_id)
  references public.couriers (id)
  on delete set null;

-- courier_sessions i order_offers vec imaju `on delete cascade` iz migracije
-- 20260831100000, pa se njihovi redovi brisu sami. Ovde se ne diraju.

create or replace function public.owner_delete_courier(p_courier_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.couriers where id = p_courier_id) then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  -- Ziva ponuda ili vozja: brisanjem bi courier_id postao NULL, a status bi
  -- ostao 'poslata_kuriru' / 'krenuo'. Takva porudzbina ne pripada nikome i
  -- ne vraca se u red — zaglavila bi se zauvek. Zato prvo mora da se resi.
  if exists (
    select 1 from public.orders
    where courier_id = p_courier_id
      and status in ('poslata_kuriru', 'krenuo')
  ) then
    return jsonb_build_object('ok', false, 'error', 'has_live_order');
  end if;

  delete from public.couriers where id = p_courier_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.owner_delete_courier(uuid) from public;
revoke execute on function public.owner_delete_courier(uuid) from anon;
grant execute on function public.owner_delete_courier(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor).
--
-- 1) Prava: prvo FALSE, drugo TRUE.
--   select has_function_privilege('anon','public.owner_delete_courier(uuid)','execute');
--   select has_function_privilege('authenticated','public.owner_delete_courier(uuid)','execute');
--
-- 2) Strani kljuc sada mora da pise SET NULL:
--   select confupdtype, confdeltype from pg_constraint
--   where conname = 'orders_courier_id_fkey';   -- confdeltype mora biti 'n'
--
-- 3) Brisanje kurira koji je vozio: porudzbine ostaju, courier_id postaje NULL.
--   select public.owner_delete_courier('<id>');
--   select public_number, status, courier_id from public.orders
--   where courier_id is null and status = 'isporuceno';
--
-- 4) Kurir sa zivom ponudom se ne brise:
--   select public.owner_delete_courier('<id>');  -- ok=false, has_live_order
-- ---------------------------------------------------------------------------

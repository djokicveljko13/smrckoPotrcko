-- Brisanje vise ne blokira aktivna ponuda ili voznja.
-- Primeniti posle 20260906100000_owner_delete_courier.sql.
-- Sve izmene su u istoj transakciji: neuspeh ponistava ceo postupak.
create or replace function public.owner_delete_courier(p_courier_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Zakljucaj kurira i iskljuci ga iz nove automatske dodele.
  update public.couriers
  set is_active = false, on_shift = false
  where id = p_courier_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  -- Vlasnik ove porudzbine ponovo dodeljuje sa table.
  -- Zavrsene voznje ne menjaju status.
  update public.orders
  set status = 'nova',
      courier_id = null,
      assigned_at = null
  where courier_id = p_courier_id
    and status in ('nova', 'poslata_kuriru', 'krenuo');

  -- FK pravila uklanjaju sesije i ponude, a starim voznjama
  -- postavljaju courier_id na NULL. Stari kurirski link vise ne radi.
  delete from public.couriers where id = p_courier_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.owner_delete_courier(uuid) from public;
revoke execute on function public.owner_delete_courier(uuid) from anon;
grant execute on function public.owner_delete_courier(uuid) to authenticated;

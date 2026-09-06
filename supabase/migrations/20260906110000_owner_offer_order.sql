-- Vlasnik rucno salje porudzbinu kuriru kog sam izabere.
--
-- Zasto uopste, kad postoji auto-dodela: baza nudi samo kuriru koji je na smeni
-- i slobodan. Kad su svi zauzeti, porudzbina visi kao 'nova' i niko ne moze
-- nista. Isto tako, kad kurir dobije ponudu pa cuti, vlasnik nema nacin da mu
-- je oduzme. Ova funkcija resava oba slucaja.
--
-- Ono sto se NE menja: dalje je sve isto kao kod auto-dodele. Kurir dobija
-- Telegram, sme da odbije, a odbijena porudzbina se vraca u red.
-- courier_respond_to_offer se ne dira.
--
-- Vidi docs/featureAdmin.md, Faza 4.

create or replace function public.owner_offer_order_to_courier(
  p_order_id uuid,
  p_courier_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_courier public.couriers%rowtype;
begin
  -- 1. Zakljucaj red. Dva brza klika (ili klik u istom trenutku kad baza sama
  --    dodeljuje) ne smeju da upisu dva kurira. Drugi poziv ceka prvi.
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_order');
  end if;

  -- 2. 'krenuo' = kurir je prihvatio i vozi, kupac ceka bas njega.
  --    'isporuceno' = gotovo. Nijedno se ne preotima.
  if v_order.status not in ('nova', 'poslata_kuriru') then
    return jsonb_build_object('ok', false, 'error', 'not_offerable');
  end if;

  select * into v_courier
  from public.couriers
  where id = p_courier_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_courier');
  end if;

  if not v_courier.is_active then
    return jsonb_build_object('ok', false, 'error', 'inactive');
  end if;

  -- 3. Pravilo "jedan kurir = jedna ziva voznja" mora da vazi i ovde; na njega
  --    se oslanja courier_respond_to_offer kad kurir klikne "Prihvatam".
  --    `id <> p_order_id` izuzima OVU porudzbinu: ako je vec ponudjena bas
  --    njemu, ne sme da ispadne da je zauzet sam sobom. Time usput radi i
  --    ponovno slanje istom kuriru (kurir ne odgovara -> posalji opet).
  if exists (
    select 1 from public.orders
    where courier_id = p_courier_id
      and status in ('poslata_kuriru', 'krenuo')
      and id <> p_order_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'busy');
  end if;

  -- 4. Porudzbina je bila kod drugog kurira: zatvori mu ponudu.
  --    'istekla', ne 'odbijena' — kurir nije odbio, vlasnik mu je oduzeo.
  --    Red u order_offers OSTAJE, pa mu auto-dodela vise nece nuditi ovu istu.
  if v_order.courier_id is not null and v_order.courier_id <> p_courier_id then
    update public.order_offers
    set outcome = 'istekla',
        responded_at = now()
    where order_id = p_order_id
      and courier_id = v_order.courier_id
      and outcome = 'ponudjena';
  end if;

  update public.orders
  set courier_id = p_courier_id,
      status = 'poslata_kuriru',
      assigned_at = now()
  where id = p_order_id;

  -- 5. Par (order_id, courier_id) je unique. Ako je ovaj kurir vec jednom
  --    dobio ovu porudzbinu (pa odbio ili mu je istekla), obican insert bi
  --    pukao. `on conflict do update` tada osvezi postojeci red umesto da baci
  --    gresku — to je "upsert".
  insert into public.order_offers (order_id, courier_id)
  values (p_order_id, p_courier_id)
  on conflict (order_id, courier_id) do update
  set outcome = 'ponudjena',
      offered_at = now(),
      responded_at = null;

  -- 6. Rucna dodela se racuna u red cekanja: kurir koji je upravo dobio posao
  --    ide na kraj reda, da auto-dodela posle njega uzme nekog drugog.
  update public.couriers
  set last_offer_at = now()
  where id = p_courier_id;

  return jsonb_build_object('ok', true, 'courier_id', p_courier_id);
end;
$$;

revoke execute on function public.owner_offer_order_to_courier(uuid, uuid) from public;
revoke execute on function public.owner_offer_order_to_courier(uuid, uuid) from anon;
grant execute on function public.owner_offer_order_to_courier(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor).
--
-- 1) Prava: prvo FALSE, drugo TRUE.
--   select has_function_privilege('anon','public.owner_offer_order_to_courier(uuid,uuid)','execute');
--   select has_function_privilege('authenticated','public.owner_offer_order_to_courier(uuid,uuid)','execute');
--
-- 2) Porudzbina koja visi (svi van smene) ide izabranom kuriru:
--   update public.couriers set on_shift = false;
--   -- napravi porudzbinu sa sajta; ostace 'nova'
--   select public.owner_offer_order_to_courier('<order_id>', '<courier_id>');
--   select status, courier_id from public.orders where id = '<order_id>';
--
-- 3) Preotimanje od kurira koji cuti (porudzbina je u 'poslata_kuriru'):
--   select public.owner_offer_order_to_courier('<order_id>', '<drugi_courier_id>');
--   select courier_id, outcome from public.order_offers where order_id = '<order_id>';
--   -- ocekivano: prvi kurir 'istekla', drugi 'ponudjena'
--
-- 4) Kurir koji vec vozi drugu porudzbinu:
--   select public.owner_offer_order_to_courier('<order_id>', '<zauzet_courier_id>');
--   -- ok=false, busy
--
-- 5) Porudzbina koju je kurir vec prihvatio ('krenuo'):
--   select public.owner_offer_order_to_courier('<order_id>', '<courier_id>');
--   -- ok=false, not_offerable
--
-- 6) Ponovno slanje ISTOM kuriru mora da prodje (za nov Telegram):
--   select public.owner_offer_order_to_courier('<order_id>', '<isti_courier_id>');
--   -- ok=true
-- ---------------------------------------------------------------------------

-- Phase 4: the database picks the free courier. No Telegram, no expire, no admin UI.
--
-- Why this lives in SQL, not TypeScript:
-- two orders in the same second would both read "Kurir 1 is free" and both
-- write him. FOR UPDATE SKIP LOCKED makes the second request skip the locked
-- row and take the next courier (or leave the order as nova).
--
-- offer_order_to_next_courier and drain_waiting_orders are NOT RPCs.
-- create_web_order (anon) may call them because it is security definer —
-- it runs as the table owner. Guests cannot call these two themselves.

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

  -- Lock the order first. Two calls for the SAME row must not assign two couriers.
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  -- Manual WhatsApp assign (and accept) leave status != nova. Do not overwrite.
  if v_order.status is distinct from 'nova' or v_order.courier_id is not null then
    return null;
  end if;

  -- Free = on shift AND no live offer/ride AND never offered this order before.
  -- SKIP LOCKED: if another transaction already grabbed this courier, skip him.
  select c.id into v_courier_id
  from public.couriers c
  where c.on_shift
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

-- CREATE OR REPLACE cannot change a return type. Phase 5 later changes this
-- from integer to uuid; drop first so this file can be pasted more than once.
drop function if exists public.drain_waiting_orders();

create function public.drain_waiting_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_courier_id uuid;
  v_tried uuid[] := '{}';
begin
  -- One successful offer fills the slot that just opened. Skip a nova that
  -- nobody currently free can take (all declined it) and try the next oldest.
  loop
    v_order_id := null;

    select o.id into v_order_id
    from public.orders o
    where o.status = 'nova'
      and o.courier_id is null
      and not (o.id = any (v_tried))
    order by o.created_at, o.id
    limit 1
    for update of o skip locked;

    exit when v_order_id is null;

    v_tried := array_append(v_tried, v_order_id);

    v_courier_id := public.offer_order_to_next_courier(v_order_id);

    if v_courier_id is not null then
      return 1;
    end if;
  end loop;

  return 0;
end;
$$;

revoke all on function public.drain_waiting_orders() from public;
revoke all on function public.drain_waiting_orders() from anon, authenticated;

-- Guest insert still returns only the ticket number. Dispatch is internal.
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
  v_id uuid;
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
  returning id, public_number into v_id, v_number;

  perform public.offer_order_to_next_courier(v_id);

  return v_number;
end;
$$;

revoke all on function public.create_web_order(text, text, text, text, public.order_zone) from public;
grant execute on function public.create_web_order(text, text, text, text, public.order_zone) to anon;

create or replace function public.courier_set_shift(
  p_session_token text,
  p_on_shift boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier_id uuid;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  update public.couriers
  set on_shift = p_on_shift
  where id = v_courier_id;

  if p_on_shift then
    perform public.drain_waiting_orders();
  end if;

  return jsonb_build_object('ok', true, 'on_shift', p_on_shift);
end;
$$;

revoke all on function public.courier_set_shift(text, boolean) from public;
grant execute on function public.courier_set_shift(text, boolean) to anon, authenticated;

create or replace function public.courier_respond_to_offer(
  p_session_token text,
  p_order_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier_id uuid;
  v_offer public.order_offers%rowtype;
  v_order public.orders%rowtype;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  select * into v_offer
  from public.order_offers
  where order_id = p_order_id
    and courier_id = v_courier_id
    and outcome = 'ponudjena'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_offer');
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found
     or v_order.courier_id is distinct from v_courier_id
     or v_order.status is distinct from 'poslata_kuriru' then
    return jsonb_build_object('ok', false, 'error', 'no_offer');
  end if;

  if p_accept then
    if exists (
      select 1 from public.orders
      where courier_id = v_courier_id
        and status = 'krenuo'
        and id <> p_order_id
    ) then
      return jsonb_build_object('ok', false, 'error', 'busy');
    end if;

    update public.order_offers
    set outcome = 'prihvacena',
        responded_at = now()
    where id = v_offer.id;

    update public.orders
    set status = 'krenuo'
    where id = p_order_id;
  else
    update public.order_offers
    set outcome = 'odbijena',
        responded_at = now()
    where id = v_offer.id;

    -- Back to nova so offer_order_to_next_courier will accept it.
    -- This same order goes to the next free courier (may jump the FIFO queue).
    update public.orders
    set status = 'nova',
        courier_id = null,
        assigned_at = null
    where id = p_order_id;

    perform public.offer_order_to_next_courier(p_order_id);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.courier_respond_to_offer(text, uuid, boolean) from public;
grant execute on function public.courier_respond_to_offer(text, uuid, boolean) to anon, authenticated;

create or replace function public.courier_mark_delivered(
  p_session_token text,
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier_id uuid;
  v_order public.orders%rowtype;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found
     or v_order.courier_id is distinct from v_courier_id
     or v_order.status is distinct from 'krenuo' then
    return jsonb_build_object('ok', false, 'error', 'not_active');
  end if;

  update public.orders
  set status = 'isporuceno'
  where id = p_order_id;

  -- Round-robin: the next nova goes to whoever has waited longest, not
  -- necessarily the courier who just delivered.
  perform public.drain_waiting_orders();

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.courier_mark_delivered(text, uuid) from public;
grant execute on function public.courier_mark_delivered(text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tests (SQL Editor, as postgres). One tab in order is NOT a race.
-- Reset last_offer_at first if you already used the seed couriers:
--   update public.couriers set last_offer_at = null, on_shift = true;
--
-- Queue: busy courier + new order stays nova; after a free courier exists,
-- drain (or a second free courier) picks it up.
--   -- make only Kurir 1 free, give him a live ride, then create a web order:
--   update public.couriers set on_shift = (name = 'Kurir 1'), last_offer_at = null;
--   -- put Kurir 1 on a fake krenuo row, or just run two create_web_order:
--   select public.create_web_order('test-q1','Maxi','Ulica 1','0600000001','grad');
--   select public.create_web_order('test-q2','Maxi','Ulica 2','0600000002','grad');
--   -- expect: one poslata_kuriru (Kurir 1), one nova (he is busy).
--
-- Rotation: two free couriers, three orders in a row — they alternate.
--   update public.couriers set on_shift = true, last_offer_at = null;
--   select public.create_web_order('test-r1','Maxi','Ulica 1','0600000001','grad');
--   select public.create_web_order('test-r2','Maxi','Ulica 2','0600000002','grad');
--   select public.create_web_order('test-r3','Maxi','Ulica 3','0600000003','grad');
--   -- expect r1 and r3 same courier, r2 the other; third stays nova if both busy.
--
-- Decline: "Ne mogu" offers THIS order to the other courier, first never again.
--   -- after an offer exists, as the courier session:
--   -- select public.courier_respond_to_offer('<session>', '<order_id>', false);
--   -- first courier: order_offers.outcome = odbijena; order goes to the other.
--
-- Race: one free courier, TWO SQL tabs, run at the same moment:
--   select public.create_web_order('test-race-a','Maxi','Ulica 1','0600000001','grad');
--   select public.create_web_order('test-race-b','Maxi','Ulica 2','0600000002','grad');
--   -- expect exactly one poslata_kuriru, one nova. Sequential tabs only prove the queue.
--
-- Rights: this must fail for the anon role (no GRANT):
--   set role anon;
--   select public.offer_order_to_next_courier('00000000-0000-0000-0000-000000000000');
--   reset role;
-- ---------------------------------------------------------------------------

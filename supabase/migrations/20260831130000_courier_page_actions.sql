-- Phase 3: courier page actions. No auto-dispatch, no Telegram, no expire.
--
-- Why these are functions, not "update orders from the app":
-- the courier has no login. If we allowed a direct UPDATE, anyone with the
-- anon key could change any order. A security definer function checks the
-- session, then touches ONLY that courier's current offer / ride.

-- After applying, to see the buttons without waiting for phase 4:
--   -- newest nova order → pending offer for Kurir 1
--   with c as (
--     select id from public.couriers where name = 'Kurir 1' limit 1
--   ), o as (
--     select id from public.orders
--     where status = 'nova' order by created_at desc limit 1
--   )
--   update public.orders
--   set courier_id = (select id from c),
--       status = 'poslata_kuriru',
--       assigned_at = now()
--   where id = (select id from o);
--
--   insert into public.order_offers (order_id, courier_id)
--   select o.id, c.id from public.orders o, public.couriers c
--   where o.status = 'poslata_kuriru'
--     and o.courier_id = c.id
--     and c.name = 'Kurir 1'
--   on conflict (order_id, courier_id) do nothing;

create or replace function public.courier_session_courier_id(p_session_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_session_token is null or length(trim(p_session_token)) = 0 then
    return null;
  end if;

  delete from public.courier_sessions
  where token = p_session_token
    and expires_at <= now();

  select s.courier_id into v_id
  from public.courier_sessions s
  where s.token = p_session_token
    and s.expires_at > now();

  return v_id;
end;
$$;

revoke all on function public.courier_session_courier_id(text) from public;

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
    'zone', o.zone,
    'status', o.status,
    'offered_at', p_offered_at
  );
$$;

revoke all on function public.courier_job_json(public.orders, timestamptz) from public;

create or replace function public.courier_dashboard(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier_id uuid;
  v_name text;
  v_on_shift boolean;
  v_offer jsonb;
  v_active jsonb;
  v_today jsonb;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  select c.name, c.on_shift into v_name, v_on_shift
  from public.couriers c
  where c.id = v_courier_id;

  select public.courier_job_json(o, f.offered_at)
  into v_offer
  from public.order_offers f
  join public.orders o on o.id = f.order_id
  where f.courier_id = v_courier_id
    and f.outcome = 'ponudjena'
    and o.status = 'poslata_kuriru'
    and o.courier_id = v_courier_id
  order by f.offered_at desc
  limit 1;

  select public.courier_job_json(o, null::timestamptz)
  into v_active
  from public.orders o
  where o.courier_id = v_courier_id
    and o.status = 'krenuo'
  order by o.assigned_at desc nulls last
  limit 1;

  select coalesce(
    jsonb_agg(public.courier_job_json(o, null::timestamptz) order by o.updated_at desc),
    '[]'::jsonb
  )
  into v_today
  from public.orders o
  where o.courier_id = v_courier_id
    and o.status = 'isporuceno'
    and timezone('Europe/Belgrade', o.updated_at)::date
      = timezone('Europe/Belgrade', now())::date;

  return jsonb_build_object(
    'ok', true,
    'name', v_name,
    'on_shift', v_on_shift,
    'offer', v_offer,
    'active', v_active,
    'today', v_today
  );
end;
$$;

revoke all on function public.courier_dashboard(text) from public;
grant execute on function public.courier_dashboard(text) to anon, authenticated;

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

  -- Phase 4 will drain the waiting queue when a courier turns shift ON.
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

    -- Back to the queue. Phase 4 will offer it to the next free courier.
    update public.orders
    set status = 'nova',
        courier_id = null,
        assigned_at = null
    where id = p_order_id;
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

  -- Phase 4 will then pull the oldest waiting nova order for this courier.
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.courier_mark_delivered(text, uuid) from public;
grant execute on function public.courier_mark_delivered(text, uuid) to anon, authenticated;

-- Phase 5: return who got the new offer so Next.js can send Telegram.
-- Does not talk to Telegram itself (bot token stays out of the database).
--
-- drain_waiting_orders used to return integer (0/1). CREATE OR REPLACE cannot
-- change a return type, so we drop it first. Only other security definer
-- functions call it.

drop function if exists public.drain_waiting_orders();

create function public.drain_waiting_orders()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_courier_id uuid;
  v_tried uuid[] := '{}';
begin
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
      return v_courier_id;
    end if;
  end loop;

  return null;
end;
$$;

revoke all on function public.drain_waiting_orders() from public;
revoke all on function public.drain_waiting_orders() from anon, authenticated;

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
  v_telegram_linked boolean;
  v_offer jsonb;
  v_active jsonb;
  v_today jsonb;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  select c.name, c.on_shift, (c.telegram_chat_id is not null)
  into v_name, v_on_shift, v_telegram_linked
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
    'telegram_linked', v_telegram_linked,
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
  v_offered uuid;
begin
  v_courier_id := public.courier_session_courier_id(p_session_token);

  if v_courier_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_session');
  end if;

  update public.couriers
  set on_shift = p_on_shift
  where id = v_courier_id;

  if p_on_shift then
    v_offered := public.drain_waiting_orders();
  end if;

  return jsonb_build_object(
    'ok', true,
    'on_shift', p_on_shift,
    'offered_courier_id', v_offered
  );
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
  v_offered uuid;
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

    update public.orders
    set status = 'nova',
        courier_id = null,
        assigned_at = null
    where id = p_order_id;

    v_offered := public.offer_order_to_next_courier(p_order_id);
  end if;

  return jsonb_build_object(
    'ok', true,
    'offered_courier_id', v_offered
  );
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
  v_offered uuid;
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

  v_offered := public.drain_waiting_orders();

  return jsonb_build_object(
    'ok', true,
    'offered_courier_id', v_offered
  );
end;
$$;

revoke all on function public.courier_mark_delivered(text, uuid) from public;
grant execute on function public.courier_mark_delivered(text, uuid) to anon, authenticated;

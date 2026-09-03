-- Phase 2: courier can log in with the URL token + PIN.
-- No shift toggle, no accept/decline, no Telegram yet.
--
-- Three functions, all security definer (they run as the table owner, so they
-- can read pin_hash / sessions which RLS hides from anon):
--   courier_peek     — is this URL real? returns only the name
--   courier_login     — check PIN, mint a session row, return the session token
--   courier_whoami    — given a session token, who is this (or nobody)
--   mint_courier_pin  — owner forges a PIN once; plaintext comes back once
--
-- After applying, in the SQL Editor mint PINs and copy the URLs:
--   select name,
--          public.mint_courier_pin(id) as pin,
--          '/k/' || access_token as url
--   from public.couriers;

create or replace function public.courier_peek(p_access_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select c.name into v_name
  from public.couriers c
  where c.access_token = p_access_token;

  return v_name;
end;
$$;

revoke all on function public.courier_peek(text) from public;
grant execute on function public.courier_peek(text) to anon, authenticated;

create or replace function public.courier_whoami(p_session_token text)
returns table (
  courier_id uuid,
  name text,
  access_token text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.courier_sessions
  where token = p_session_token
    and expires_at <= now();

  return query
    select c.id, c.name, c.access_token
    from public.courier_sessions s
    join public.couriers c on c.id = s.courier_id
    where s.token = p_session_token
      and s.expires_at > now();
end;
$$;

revoke all on function public.courier_whoami(text) from public;
grant execute on function public.courier_whoami(text) to anon, authenticated;

create or replace function public.courier_login(
  p_access_token text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courier public.couriers%rowtype;
  v_fails integer;
  v_session text;
begin
  if p_pin is null or p_pin !~ '^[0-9]{6}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_pin');
  end if;

  select * into v_courier
  from public.couriers
  where access_token = p_access_token;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;

  if v_courier.pin_hash is null then
    return jsonb_build_object('ok', false, 'error', 'no_pin');
  end if;

  if v_courier.pin_locked_until is not null
     and v_courier.pin_locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  if extensions.crypt(p_pin, v_courier.pin_hash) = v_courier.pin_hash then
    update public.couriers
    set pin_failed_count = 0,
        pin_locked_until = null
    where id = v_courier.id;

    v_session := encode(extensions.gen_random_bytes(32), 'hex');

    insert into public.courier_sessions (token, courier_id, expires_at)
    values (v_session, v_courier.id, now() + interval '12 hours');

    return jsonb_build_object('ok', true, 'session_token', v_session);
  end if;

  v_fails := v_courier.pin_failed_count + 1;

  if v_fails >= 5 then
    update public.couriers
    set pin_failed_count = v_fails,
        pin_locked_until = now() + interval '15 minutes'
    where id = v_courier.id;

    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  update public.couriers
  set pin_failed_count = v_fails
  where id = v_courier.id;

  return jsonb_build_object('ok', false, 'error', 'bad_pin');
end;
$$;

revoke all on function public.courier_login(text, text) from public;
grant execute on function public.courier_login(text, text) to anon, authenticated;

create or replace function public.mint_courier_pin(p_courier_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n bigint;
  v_pin text;
begin
  if not exists (select 1 from public.couriers where id = p_courier_id) then
    raise exception 'unknown courier';
  end if;

  v_n := ('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint;
  v_pin := lpad((v_n % 1000000)::text, 6, '0');

  update public.couriers
  set pin_hash = extensions.crypt(v_pin, extensions.gen_salt('bf', 10)),
      pin_failed_count = 0,
      pin_locked_until = null
  where id = p_courier_id;

  return v_pin;
end;
$$;

revoke all on function public.mint_courier_pin(uuid) from public;
grant execute on function public.mint_courier_pin(uuid) to authenticated;

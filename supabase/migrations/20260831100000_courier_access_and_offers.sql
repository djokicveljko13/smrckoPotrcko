-- Phase 1 of courier auto-dispatch: schema only.
-- No login, no offer function, no Telegram yet.
--
-- Why these tables exist is in docs/featureKurir.md. Short version:
--   couriers gets a permanent URL token + a hashed PIN (never the PIN itself).
--   order_offers remembers who was offered which order, so we never re-offer
--   a declined one. courier_sessions is a row we can DELETE to kick someone out.

create type public.offer_outcome as enum (
  'ponudjena',
  'prihvacena',
  'odbijena',
  'istekla'
);

-- Permanent /k/{token} lives on the courier, not on each order.
-- DEFAULT is evaluated per row, so existing seed couriers each get a unique token.
alter table public.couriers
  add column access_token text not null unique
    default encode(extensions.gen_random_bytes(32), 'hex'),
  add column pin_hash text,
  add column pin_failed_count integer not null default 0,
  add column pin_locked_until timestamptz,
  add column telegram_chat_id bigint,
  add column last_offer_at timestamptz,
  add constraint couriers_pin_failed_count_nonneg
    check (pin_failed_count >= 0);

-- One Telegram account cannot be two couriers.
create unique index couriers_telegram_chat_id_uidx
  on public.couriers (telegram_chat_id)
  where telegram_chat_id is not null;

create table public.order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  courier_id uuid not null references public.couriers (id) on delete cascade,
  offered_at timestamptz not null default now(),
  responded_at timestamptz,
  outcome public.offer_outcome not null default 'ponudjena',
  -- Same courier is never offered the same order twice (declined stays declined).
  unique (order_id, courier_id),
  constraint order_offers_response_matches_outcome check (
    (outcome = 'ponudjena' and responded_at is null)
    or (outcome <> 'ponudjena' and responded_at is not null)
  )
);

create index order_offers_order_id_idx on public.order_offers (order_id);
create index order_offers_courier_id_idx on public.order_offers (courier_id);
-- expire_stale_offers() (phase 6) only cares about still-open rows.
create index order_offers_pending_idx
  on public.order_offers (offered_at)
  where outcome = 'ponudjena';

-- Session token is the secret in the httpOnly cookie. Primary key = unique.
-- We store it as a row (not a signed cookie) so "revoke access" can DELETE it.
create table public.courier_sessions (
  token text primary key,
  courier_id uuid not null references public.couriers (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index courier_sessions_courier_id_idx
  on public.courier_sessions (courier_id);

alter table public.order_offers enable row level security;
alter table public.courier_sessions enable row level security;

-- anon: no policy = guests cannot read offers or sessions.
-- Owner may see the offer history on the board (who was offered, who declined).
-- Writes go through security definer functions later, not through the client.
create policy order_offers_owner_select
on public.order_offers
for select
to authenticated
using (true);

-- No select/insert/update/delete policy on courier_sessions for anon or
-- authenticated. Session tokens are secrets. Only security definer functions
-- (and the table owner / service_role) will touch this table.

-- Phase 2: orders + couriers and who may touch them.
-- RLS is on: no policy = nobody (except the database owner / service role).

create extension if not exists pgcrypto with schema extensions;

-- Fixed lists of allowed values. Better than free text: the DB rejects "gradskooo".
create type public.order_zone as enum ('grad', 'van_grada');
create type public.order_source as enum ('sajt', 'telefon');
create type public.order_status as enum (
  'nova',
  'poslata_kuriru',
  'krenuo',
  'isporuceno'
);

create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  on_shift boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Public number for humans (P-1). Not a secret.
  public_number text not null unique,
  title text not null,
  shop text not null,
  address text not null,
  phone text not null,
  zone public.order_zone not null,
  source public.order_source not null,
  -- Null until the client sends the two prices.
  delivery_price numeric(10, 2),
  status public.order_status not null default 'nova',
  courier_id uuid references public.couriers (id),
  assigned_at timestamptz,
  -- Secret in the courier URL. Never sequential.
  courier_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_title_not_blank check (char_length(trim(title)) > 0),
  constraint orders_shop_not_blank check (char_length(trim(shop)) > 0),
  constraint orders_address_not_blank check (char_length(trim(address)) > 0),
  constraint orders_phone_not_blank check (char_length(trim(phone)) > 0)
);

create sequence public.order_public_number_seq start with 1;

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_courier_id_idx on public.orders (courier_id);

create or replace function public.set_order_defaults()
returns trigger
language plpgsql
as $$
begin
  -- Always mint these. The client must not choose P-1 or token "abc".
  new.public_number := 'P-' || nextval('public.order_public_number_seq')::text;
  new.courier_token := encode(extensions.gen_random_bytes(32), 'hex');
  new.updated_at := now();

  -- Guest (anon key, no login) may only create a website order.
  if auth.role() = 'anon' then
    new.source := 'sajt';
    new.status := 'nova';
    new.courier_id := null;
    new.assigned_at := null;
    new.delivery_price := null;
  end if;

  return new;
end;
$$;

create trigger orders_set_defaults
before insert on public.orders
for each row
execute function public.set_order_defaults();

create or replace function public.touch_order_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_touch_updated_at
before update on public.orders
for each row
execute function public.touch_order_updated_at();

alter table public.couriers enable row level security;
alter table public.orders enable row level security;

-- Guests: create a web order. Cannot read any order (no select policy for anon).
-- WITH CHECK runs after the BEFORE trigger, so we assert the forced values.
create policy orders_anon_insert_web
on public.orders
for insert
to anon
with check (
  source = 'sajt'
  and status = 'nova'
  and courier_id is null
  and assigned_at is null
  and delivery_price is null
);

-- Logged-in owner: full read of orders (one owner in V1).
create policy orders_owner_select
on public.orders
for select
to authenticated
using (true);

create policy orders_owner_insert
on public.orders
for insert
to authenticated
with check (true);

create policy orders_owner_update
on public.orders
for update
to authenticated
using (true)
with check (true);

-- Couriers table: owner only. Guests never see phone numbers of couriers.
create policy couriers_owner_select
on public.couriers
for select
to authenticated
using (true);

create policy couriers_owner_update
on public.couriers
for update
to authenticated
using (true)
with check (true);

-- Owner inserts couriers from SQL / Table Editor for V1 (no admin CRUD UI yet).
-- service_role and table owner bypass RLS, so dashboard SQL still works.
create policy couriers_owner_insert
on public.couriers
for insert
to authenticated
with check (true);

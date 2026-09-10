-- Kupovina iz marketa (docs/featureNamirnice.md).
-- Nova vrsta reda u orders + tabela stavki + RPC create_shopping_order.
-- courier_job_json dobija order_type, shopping_note i items (stable, čita drugu tabelu).

-- ---------------------------------------------------------------------------
-- 1. Vrsta porudžbine + napomena za kupovinu
-- ---------------------------------------------------------------------------
create type public.order_type as enum ('dostava', 'kupovina');

alter table public.orders
  add column order_type public.order_type not null default 'dostava',
  add column shopping_note text;

-- ---------------------------------------------------------------------------
-- 2. Stavke liste
-- ---------------------------------------------------------------------------
create table public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  sort_order integer not null,
  text       text not null,
  checked    boolean not null default false,
  created_at timestamptz not null default now(),
  constraint shopping_items_text_not_blank check (char_length(trim(text)) > 0),
  unique (order_id, sort_order)
);

create index shopping_items_order_idx on public.shopping_items (order_id, sort_order);

alter table public.shopping_items enable row level security;

create policy shopping_items_owner_select on public.shopping_items
  for select to authenticated using (true);
-- anon: nijedna polisa = nikakav pristup, isto kao orders

-- ---------------------------------------------------------------------------
-- 3. RPC create_shopping_order (samo service_role)
-- ---------------------------------------------------------------------------
create function public.create_shopping_order(
  p_title text,
  p_shop text,
  p_address text,
  p_phone text,
  p_delivery_price numeric,
  p_place_id text,
  p_note text,
  p_items text[]
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_number text;
begin
  if coalesce(array_length(p_items, 1), 0) not between 1 and 30 then
    raise exception 'shopping list must have 1..30 items';
  end if;

  insert into public.orders (
    title,
    shop,
    address,
    phone,
    source,
    order_type,
    delivery_price,
    destination_place_id,
    shopping_note
  ) values (
    trim(p_title),
    trim(p_shop),
    trim(p_address),
    trim(p_phone),
    'sajt',
    'kupovina',
    p_delivery_price,
    nullif(trim(p_place_id), ''),
    nullif(trim(p_note), '')
  )
  returning id, public_number into v_id, v_number;

  insert into public.shopping_items (order_id, sort_order, text)
  select v_id, ord::integer, trim(t)
  from unnest(p_items) with ordinality as u(t, ord)
  where char_length(trim(t)) > 0;

  perform public.offer_order_to_next_courier(v_id);
  return v_number;
end;
$$;

-- Dva revoke-a: Supabase default privileges daju EXECUTE i anon-u direktno.
revoke all on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]
) from public;
revoke execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]
) from anon, authenticated;
grant execute on function public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]
) to service_role;

-- ---------------------------------------------------------------------------
-- 4. courier_job_json: order_type, napomena, stavke
-- ---------------------------------------------------------------------------
-- Volatilnost immutable → stable: funkcija sada čita shopping_items.
create or replace function public.courier_job_json(
  o public.orders,
  p_offered_at timestamptz
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', o.id,
    'public_number', o.public_number,
    'title', o.title,
    'shop', o.shop,
    'address', o.address,
    'phone', o.phone,
    'delivery_price', o.delivery_price,
    'distance_m', o.distance_m,
    'status', o.status,
    'offered_at', p_offered_at,
    'order_type', o.order_type,
    'shopping_note', o.shopping_note,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', si.id,
          'text', si.text,
          'checked', si.checked
        )
        order by si.sort_order
      )
      from public.shopping_items si
      where si.order_id = o.id
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.courier_job_json(public.orders, timestamptz) from public;

-- auth.role() is not always 'anon' for public REST inserts.
-- Treat everyone except a logged-in user as a guest.

create or replace function public.set_order_defaults()
returns trigger
language plpgsql
as $$
begin
  new.public_number := 'P-' || nextval('public.order_public_number_seq')::text;
  new.courier_token := encode(extensions.gen_random_bytes(32), 'hex');
  new.updated_at := now();

  if auth.role() is distinct from 'authenticated' then
    new.source := 'sajt';
    new.status := 'nova';
    new.courier_id := null;
    new.assigned_at := null;
    new.delivery_price := null;
  end if;

  return new;
end;
$$;

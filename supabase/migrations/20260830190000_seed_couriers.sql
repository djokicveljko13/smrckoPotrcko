-- Two on-shift couriers for V1. Same phone on purpose: test WhatsApp on your own number.
-- Idempotent: safe to paste again in the SQL Editor.

insert into public.couriers (name, phone, on_shift)
select v.name, v.phone, true
from (
  values
    ('Kurir 1', '381666660971'),
    ('Kurir 2', '381666660971')
) as v(name, phone)
where not exists (
  select 1 from public.couriers c where c.name = v.name
);

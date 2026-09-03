-- Popravka 20260902120000: `revoke ... from public` nije bio dovoljan.
--
-- Supabase projekti imaju ALTER DEFAULT PRIVILEGES koji SVAKOJ novoj funkciji
-- u `public` daje `grant execute` direktno rolama anon / authenticated /
-- service_role — ne preko PUBLIC. Zato se revoke mora ciljati na te role
-- poimence, inače anon i dalje sme da zove funkciju.

-- create_web_order: samo naš server (service_role).
revoke execute on function
  public.create_web_order(text, text, text, text, numeric, integer, text)
  from anon, authenticated;

-- owner_set_delivery_price: samo ulogovan vlasnik. Bez ovoga bi anon mogao da
-- upiše cenu svakoj porudžbini kojoj cena fali.
revoke execute on function
  public.owner_set_delivery_price(uuid, numeric)
  from anon;

-- ---------------------------------------------------------------------------
-- Provera (SQL Editor). Prvo mora da vrati FALSE, drugo TRUE:
--   select has_function_privilege('anon', 'public.create_web_order(text,text,text,text,numeric,integer,text)', 'execute');
--   select has_function_privilege('service_role', 'public.create_web_order(text,text,text,text,numeric,integer,text)', 'execute');
--
--   select has_function_privilege('anon', 'public.owner_set_delivery_price(uuid,numeric)', 'execute');          -- FALSE
--   select has_function_privilege('authenticated', 'public.owner_set_delivery_price(uuid,numeric)', 'execute');  -- TRUE
-- ---------------------------------------------------------------------------

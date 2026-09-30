-- Pokrenuti TEK POSLE deploy-a koda koji šalje p_quote_id
-- (20260930130000_one_time_quote.sql + izmene u app/actions/create-*.ts).
--
-- Stare verzije bez p_quote_id ostale su da sajt radi dok se novi kod objavljuje.
-- Kad novi kod radi, one su samo zaobilaznica oko jednokratne ponude — brišemo ih.

drop function if exists public.create_web_order(
  text, text, text, text, numeric, integer, text, text
);

drop function if exists public.create_phone_order(
  text, text, text, text, numeric, integer, text, text
);

drop function if exists public.create_shopping_order(
  text, text, text, text, numeric, text, text, text[]
);

-- Provera — sva tri NULL:
--   select to_regprocedure('public.create_web_order(text,text,text,text,numeric,integer,text,text)');
--   select to_regprocedure('public.create_phone_order(text,text,text,text,numeric,integer,text,text)');
--   select to_regprocedure('public.create_shopping_order(text,text,text,text,numeric,text,text,text[])');

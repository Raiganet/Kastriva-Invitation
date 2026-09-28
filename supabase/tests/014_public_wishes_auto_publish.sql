begin;
do $$
declare
  accepting_default text;
  showing_default text;
  fn text;
begin
  select pg_catalog.pg_get_expr(d.adbin,d.adrelid) into accepting_default
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid=a.attrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname='public' and c.relname='ki_open_wish_settings' and a.attname='accepting';
  select pg_catalog.pg_get_expr(d.adbin,d.adrelid) into showing_default
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid=a.attrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname='public' and c.relname='ki_open_wish_settings' and a.attname='showing';
  if accepting_default<>'true' or showing_default<>'true' then raise exception 'FAIL auto-publish defaults';end if;
  if not exists(select 1 from pg_catalog.pg_trigger where tgname='ki_open_wish_auto_approve_before_insert' and not tgisinternal) then raise exception 'FAIL auto publish trigger';end if;
  if not exists(select 1 from pg_catalog.pg_trigger where tgname='ki_open_wish_defaults_after_sale' and not tgisinternal) then raise exception 'FAIL sale defaults trigger';end if;
  select pg_catalog.pg_get_functiondef('public.ki_open_wish_auto_approve()'::regprocedure) into fn;
  if position('new.consent is true' in lower(fn))=0 or position('new.moderation := ''approved''' in lower(fn))=0 then raise exception 'FAIL consent-bound auto publish';end if;
  raise notice 'PASS: auto-publish defaults and consent-bound triggers';
end $$;
rollback;

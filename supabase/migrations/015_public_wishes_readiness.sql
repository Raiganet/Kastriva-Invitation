-- v1.9.x: read-only diagnostics for public-wishes auto-publish readiness.
-- No customer data is changed.

create or replace function public.ki_open_wish_auto_publish_version() returns integer
language sql stable set search_path='' as $$ select 1 $$;

revoke all on function public.ki_open_wish_auto_publish_version() from public,anon,authenticated;
grant execute on function public.ki_open_wish_auto_publish_version() to anon,authenticated,service_role;

create or replace function public.ki_open_wish_audit() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  tables_ok boolean;
  grants_ok boolean;
  gateway_ok boolean;
  auto_publish_ok boolean;
  defaults_trigger_ok boolean;
  defaults_open boolean;
  names text[]:=array['ki_open_wish_platform','ki_open_wish_settings','ki_open_wishes','ki_open_wish_network','ki_open_wish_actions'];
begin
  if auth.uid() is null or not public.ki_has_confirmed_email() or not public.ki_is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;

  select count(*)=5 and coalesce(bool_and(c.relrowsecurity),false) into tables_ok
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relname=any(names);

  select not exists(
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    cross join (values('anon'),('authenticated')) roles(name)
    where n.nspname='public'
      and c.relname=any(names)
      and pg_catalog.has_table_privilege(roles.name,c.oid,'SELECT,INSERT,UPDATE,DELETE')
  ) into grants_ok;

  select count(*)=3 and coalesce(bool_and(
    not pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE')
    and not pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE')
    and pg_catalog.has_function_privilege('service_role',p.oid,'EXECUTE')
  ),false) into gateway_ok
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('ki_open_wish_feed','ki_open_wish_submit','ki_open_wish_withdraw');

  select exists(
    select 1 from pg_catalog.pg_trigger
    where tgname='ki_open_wish_auto_approve_before_insert' and not tgisinternal
  ) into auto_publish_ok;

  select exists(
    select 1 from pg_catalog.pg_trigger
    where tgname='ki_open_wish_defaults_after_sale' and not tgisinternal
  ) into defaults_trigger_ok;

  select coalesce(bool_and(pg_catalog.pg_get_expr(d.adbin,d.adrelid)='true'),false)
  into defaults_open
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid=a.attrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname='public'
    and c.relname='ki_open_wish_settings'
    and a.attname in ('accepting','showing');

  return jsonb_build_object(
    'tables_rls',tables_ok,
    'browser_tables_blocked',grants_ok,
    'public_rpc_gateway_only',gateway_ok,
    'auto_publish_trigger',auto_publish_ok,
    'future_sale_defaults_trigger',defaults_trigger_ok,
    'defaults_open',defaults_open
  );
end $$;

revoke all on function public.ki_open_wish_audit() from public,anon,authenticated;
grant execute on function public.ki_open_wish_audit() to authenticated;

comment on function public.ki_open_wish_auto_publish_version() is
'Auto-publish wishes readiness protocol 1 / migration 015. Fixed metadata only.';

notify pgrst,'reload schema';

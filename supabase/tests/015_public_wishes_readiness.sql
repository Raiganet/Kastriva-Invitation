begin;
do $$
declare fn text;
begin
  if public.ki_open_wish_auto_publish_version()<>1 then raise exception 'FAIL auto publish readiness version';end if;
  if pg_catalog.has_function_privilege('anon','public.ki_open_wish_audit()','EXECUTE') then raise exception 'FAIL admin audit exposed to anon';end if;
  if not pg_catalog.has_function_privilege('authenticated','public.ki_open_wish_audit()','EXECUTE') then raise exception 'FAIL admin audit unavailable';end if;
  select pg_catalog.pg_get_functiondef('public.ki_open_wish_audit()'::regprocedure) into fn;
  for key in select unnest(array['auto_publish_trigger','future_sale_defaults_trigger','defaults_open']) loop
    if position(key in fn)=0 then raise exception 'FAIL readiness key %',key;end if;
  end loop;
  raise notice 'PASS: auto-publish readiness metadata and audit grants';
end $$;
rollback;

-- HARNESS ONLY, entire file in a transaction. Never paste this into production.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' or current_user<>'postgres' then raise exception 'Disposable local DB only'; end if;
end $$;
set local role anon;
do $$ declare r jsonb; k text; begin
 r:=public.ki_feature_readiness();
 if r->>'contract_version'<>'1' or r->>'base_schema_version'<>'7' or r->>'diagnostics_migration'<>'12' or r->>'known_templates'<>'15' then raise exception 'FAIL diagnostic protocol'; end if;
 if exists(select 1 from jsonb_object_keys(r) key where key not in ('contract_version','base_schema_version','diagnostics_migration','known_templates','capabilities')) then raise exception 'FAIL unexpected public data'; end if;
 if (select count(*) from jsonb_object_keys(r->'capabilities'))<>6 then raise exception 'FAIL capability shape'; end if;
 foreach k in array array['legacy_content','invitation_extras','heritage_themes','luxury_theme','botanical_theme','cms_catalog_complete'] loop
  if r->'capabilities'->k is distinct from 'true'::jsonb then raise exception 'FAIL feature %',k; end if;
 end loop;
 if position('PRIVATE' in r::text)>0 or position('155001' in r::text)>0 or position('145000' in r::text)>0 or position('example.invalid' in r::text)>0 then raise exception 'FAIL private values leaked'; end if;
 begin perform 1 from public.ki_sales;raise exception 'FAIL: direct sales exposed';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.ki_public_invitation(text)','execute') or has_function_privilege('authenticated','public.ki_public_invitation(text)','execute') then raise exception 'FAIL: protected RPC reopened'; end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
 if public.ki_feature_readiness()->'capabilities'->'cms_catalog_complete' is distinct from 'true'::jsonb then raise exception 'FAIL authenticated diagnostic'; end if;
end $$;
reset role;
-- Availability is intentionally unrelated to installation capability.
savepoint hide_themes;
update public.ki_templates set active=false;
do $$ begin
 if public.ki_feature_readiness()->'capabilities'->'cms_catalog_complete' is distinct from 'true'::jsonb then raise exception 'FAIL: inactive themes treated as missing migration'; end if;
 if public.ki_feature_readiness()->>'known_templates'<>'15' then raise exception 'FAIL: inactive count'; end if;
end $$;
rollback to hide_themes;
savepoint missing_theme;
delete from public.ki_templates where slug='botanical-blush';
do $$ declare r jsonb; begin
 r:=public.ki_feature_readiness();
 if r->'capabilities'->'botanical_theme' is distinct from 'false'::jsonb or r->'capabilities'->'cms_catalog_complete' is distinct from 'false'::jsonb then raise exception 'FAIL: missing theme not detected'; end if;
end $$;
rollback to missing_theme;
-- Simulate an old validator WITHOUT changing the schema marker; rolled back immediately.
savepoint old_validator;
create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean language sql immutable set search_path='' as $$ select not(p_content ? 'music' or p_content ? 'gifts'); $$;
do $$ begin
 if public.ki_feature_readiness()->'capabilities'->'invitation_extras' is distinct from 'false'::jsonb then raise exception 'FAIL: old validator reported extra-feature ready'; end if;
end $$;
rollback to old_validator;
-- Simulate the old eight-theme CMS reader despite all newer table rows existing.
savepoint old_catalog;
create or replace function public.ki_cms_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'price',price,'active',active) order by sort_order,slug),'[]'::jsonb)
 from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event']);
$$;
do $$ declare r jsonb; begin
 r:=public.ki_feature_readiness();
 if r->'capabilities'->'heritage_themes' is distinct from 'false'::jsonb or r->'capabilities'->'cms_catalog_complete' is distinct from 'false'::jsonb then raise exception 'FAIL: legacy CMS reader reported ready'; end if;
end $$;
rollback to old_catalog;
do $$ begin raise notice 'PASS: capability diagnostics, missing-upgrade detection, hidden themes, private values, RPC grants, and no customer writes'; end $$;
rollback;

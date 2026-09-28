-- HARNESS ONLY: assertions over persistent synthetic fixtures; this file writes no data.
begin;
do $$
declare old jsonb; current_cms jsonb; original_catalog jsonb; newer_catalog jsonb; label text;
begin
 if current_database()<>'ki_isolated_test' or current_user<>'postgres' then raise exception 'Disposable local DB only'; end if;
 if public.ki_schema_version()<>7 then raise exception 'FAIL: base compatibility was changed'; end if;
 if (select count(*) from public.ki_templates)<>15 then raise exception 'FAIL: new catalog incomplete'; end if;
 if (select count(*) from public.ki_templates where category='pernikahan')<>12 then raise exception 'FAIL: wedding count'; end if;
 select value into strict old from ki_release_fixture.snapshots where key='templates';
 if old is distinct from (select jsonb_agg(to_jsonb(t) order by slug) from public.ki_templates t where slug in (select value->>'slug' from jsonb_array_elements(old))) then raise exception 'FAIL: existing metadata/price/availability changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='users') is distinct from (select jsonb_agg(to_jsonb(t) order by id) from auth.users t) then raise exception 'FAIL: users changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='invitations') is distinct from (select jsonb_agg(to_jsonb(t) order by id) from public.ki_invitations t) then raise exception 'FAIL: draft changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='sales') is distinct from (select jsonb_agg(to_jsonb(t) order by id) from public.ki_sales t) then raise exception 'FAIL: bill snapshot/expiry changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='publications') is distinct from (select jsonb_agg(to_jsonb(t) order by sale_id) from public.ki_publications t) then raise exception 'FAIL: publication changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='commerce') is distinct from (select to_jsonb(t) from public.ki_commerce_settings t where id=1) then raise exception 'FAIL: service flags/payment details changed'; end if;
 if (select value from ki_release_fixture.snapshots where key='guest_platform') is distinct from (select to_jsonb(t) from public.ki_guest_platform t where id=1) then raise exception 'FAIL: guest flags changed'; end if;
 select value into old from ki_release_fixture.snapshots where key='cms';
 select to_jsonb(t) into current_cms from public.ki_cms t where id=1;
 foreach label in array array['draft','published'] loop
  if old->label->'content' is distinct from current_cms->label->'content' then raise exception 'FAIL: CMS copy overwritten %',label; end if;
  original_catalog:=old->label->'catalog';
  select jsonb_agg(value order by ord) into newer_catalog from jsonb_array_elements(current_cms->label->'catalog') with ordinality as t(value,ord) where ord<=8;
  if original_catalog is distinct from newer_catalog then raise exception 'FAIL: old CMS prices/order/availability overwritten'; end if;
  if not public.ki_cms_valid_document(current_cms->label) then raise exception 'FAIL: new CMS document invalid'; end if;
 end loop;
 if exists(select 1 from public.ki_cms_history where not public.ki_cms_valid_document(document)) then raise exception 'FAIL: legacy history invalid'; end if;
 if public.ki_valid_content((select content from public.ki_invitations where id='d8181818-1818-4818-8818-181818181818'),'a8181818-1818-4818-8818-181818181818') is not true then raise exception 'FAIL: legacy draft rejected'; end if;
 raise notice 'PASS: 008-011 preserve historical users, drafts, prices, bills, expiry, publications, flags, and unpublished CMS copy';
end $$;
rollback;

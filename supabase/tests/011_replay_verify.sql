-- HARNESS ONLY: repeated 011/012 must not create CMS revisions or change live catalog.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' or current_user<>'postgres' then raise exception 'Disposable local DB only'; end if;
 if (select value from ki_release_fixture.snapshots where key='after_011_cms') is distinct from (select to_jsonb(t) from public.ki_cms t where id=1) then raise exception 'FAIL: repeated migration changed CMS'; end if;
 if (select value from ki_release_fixture.snapshots where key='after_011_history') is distinct from (select jsonb_agg(to_jsonb(t) order by revision) from public.ki_cms_history t) then raise exception 'FAIL: repeated migration changed CMS history'; end if;
 if (select value from ki_release_fixture.snapshots where key='after_011_templates') is distinct from (select jsonb_agg(to_jsonb(t) order by slug) from public.ki_templates t) then raise exception 'FAIL: repeated migration changed catalog'; end if;
 raise notice 'PASS: latest migration repeat and diagnostic install preserve catalog and CMS revisions';
end $$;
rollback;

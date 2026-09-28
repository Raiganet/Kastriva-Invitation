-- HARNESS ONLY: preserve the entire post-011 CMS state before repeating the latest migration.
begin;
do $$ begin if current_database()<>'ki_isolated_test' or current_user<>'postgres' then raise exception 'Disposable local DB only'; end if; end $$;
insert into ki_release_fixture.snapshots values
 ('after_011_cms',(select to_jsonb(t) from public.ki_cms t where id=1)),
 ('after_011_history',(select jsonb_agg(to_jsonb(t) order by revision) from public.ki_cms_history t)),
 ('after_011_templates',(select jsonb_agg(to_jsonb(t) order by slug) from public.ki_templates t));
commit;

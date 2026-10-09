-- Synthetic preservation markers in the disposable local fixture only.
begin;
update public.ki_templates set price=167000,active=false where slug='elegant-rose';
update public.ki_cms set draft=jsonb_set(draft,'{content,heroTitle}','"Draft belum diterbitkan — tetap simpan"'),published=jsonb_set(published,'{content,heroTitle}','"Published sebelumnya — tetap simpan"') where id=1;
create table public.ki_test_occasion_snapshot as select draft,published,revision from public.ki_cms where id=1;
commit;

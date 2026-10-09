-- Synthetic preservation markers in the disposable local fixture only.
begin;
update public.ki_templates set price=227000,active=false where slug='velvet-vow';
update public.ki_cms set draft=jsonb_set(draft,'{content,heroTitle}','"Draft belum diterbitkan — tetap simpan"'),published=jsonb_set(published,'{content,heroTitle}','"Published sebelumnya — tetap simpan"') where id=1;
create table public.ki_test_premium_snapshot as select draft,published,revision,(select md5(jsonb_agg(to_jsonb(t) order by slug)::text) from public.ki_templates t) as existing_templates_hash from public.ki_cms where id=1;
commit;

-- HARNESS ONLY: creates persistent SYNTHETIC fixtures in the disposable local test DB.
-- NOT for Supabase SQL Editor or production. The runner never points at a hosted DB.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' or current_user<>'postgres' or public.ki_schema_version()<>7 then raise exception 'Disposable local base-7 test DB required'; end if;
 if exists(select 1 from pg_namespace where nspname='ki_release_fixture') then raise exception 'Fixture exists; use a fresh disposable database'; end if;
end $$;
create schema ki_release_fixture;
revoke all on schema ki_release_fixture from public,anon,authenticated,service_role;
create table ki_release_fixture.snapshots(key text primary key,value jsonb not null);
-- Intentionally different live/draft/published prices and unpublished copy must survive upgrades.
update public.ki_templates set price=155001,name='Harga kustom tetap' where slug='elegant-rose';
update public.ki_templates set active=false where slug='modern-minimalist';
update public.ki_cms set draft=jsonb_set(draft,'{content,heroTitle}','"DRAFT BELUM DIPUBLISH - FIXTURE"'),revision=revision+1 where id=1;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values('a8181818-1818-4818-8818-181818181818','upgrade-fixture@example.invalid',now(),'{}','{}');
insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id)
values('d8181818-1818-4818-8818-181818181818','a8181818-1818-4818-8818-181818181818','elegant-rose',
 '{"groom":"FIXTURE PRIVATE NAME","bride":"Pasangan Uji","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}',1,gen_random_uuid());
-- Raw fixture represents a historical sale. This does not test or assert a real bank transfer.
insert into public.ki_sales(id,owner_id,invitation_id,theme_slug,theme_name,total_price,active_days,payment_details,
 customer_name,customer_phone,customer_email,status,paid_at,expires_at)
values('e8181818-1818-4818-8818-181818181818','a8181818-1818-4818-8818-181818181818','d8181818-1818-4818-8818-181818181818',
 'elegant-rose','Nama tema pada pesanan lama',145000,90,'{"bank":"FIXTURE ONLY"}','FIXTURE PRIVATE NAME','6280000000000','upgrade-fixture@example.invalid','paid',now(),now()+interval '90 days');
insert into public.ki_publications(sale_id,owner_id,slug,theme_slug,content,draft_revision,active)
select 'e8181818-1818-4818-8818-181818181818',owner_id,'ki-fixture-upgrade','elegant-rose',content,1,false from public.ki_invitations where id='d8181818-1818-4818-8818-181818181818';
insert into ki_release_fixture.snapshots values
 ('templates',(select jsonb_agg(to_jsonb(t) order by slug) from public.ki_templates t)),
 ('users',(select jsonb_agg(to_jsonb(t) order by id) from auth.users t)),
 ('invitations',(select jsonb_agg(to_jsonb(t) order by id) from public.ki_invitations t)),
 ('sales',(select jsonb_agg(to_jsonb(t) order by id) from public.ki_sales t)),
 ('publications',(select jsonb_agg(to_jsonb(t) order by sale_id) from public.ki_publications t)),
 ('commerce',(select to_jsonb(t) from public.ki_commerce_settings t where id=1)),
 ('guest_platform',(select to_jsonb(t) from public.ki_guest_platform t where id=1)),
 ('cms',(select to_jsonb(t) from public.ki_cms t where id=1));
commit;

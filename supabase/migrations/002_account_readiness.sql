-- Kastriva Invitation 1.2.0 — additive stage 2, same DEDICATED project as 001.
-- Run 001 first. This transaction does not delete accounts, drafts, orders, or media.
begin;
do $$
begin
 if to_regclass('public.ki_invitations') is null or to_regclass('public.ki_admins') is null
  or to_regclass('public.ki_orders') is null or to_regclass('public.ki_templates') is null
  or to_regclass('public.ki_settings') is null or to_regclass('public.ki_order_events') is null
  or to_regprocedure('public.ki_valid_content(jsonb,uuid)') is null
  or to_regprocedure('public.ki_is_admin()') is null then
  raise exception 'Install 001_foundation.sql before stage 2';
 end if;
end $$;

-- Minimal tombstones retain only IDs, not invitation content or photos.
create table if not exists public.ki_deleted_drafts (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 deleted_at timestamptz not null default now()
);
alter table public.ki_deleted_drafts enable row level security;
revoke all on public.ki_deleted_drafts from public,anon,authenticated;

create or replace function public.ki_has_confirmed_email() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from auth.users where id=(select auth.uid()) and email is not null and email<>'' and email_confirmed_at is not null); $$;
revoke all on function public.ki_has_confirmed_email() from public,anon,authenticated;
grant execute on function public.ki_has_confirmed_email() to authenticated;

create or replace function public.ki_save_draft(p_id uuid,p_theme text,p_content jsonb,p_expected_revision integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations; count_drafts integer;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed email required' using errcode='42501'; end if;
 if p_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0 or not public.ki_valid_content(p_content,actor) then raise exception 'Invalid draft' using errcode='22023'; end if;
 if not exists(select 1 from public.ki_templates where slug=p_theme and active=true and category='pernikahan') then raise exception 'Invalid theme' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_content->'photoPaths') as p(path) where not exists(select 1 from storage.objects o where o.bucket_id='ki-media' and o.name=p.path)) then raise exception 'Photo unavailable' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from public.ki_deleted_drafts where id=p_id) then raise exception 'Draft was deleted' using errcode='40001'; end if;
 select * into row_data from public.ki_invitations where id=p_id and owner_id=actor for update;
 if found then
  if row_data.last_request_id=p_request_id then
   if row_data.content<>p_content or row_data.theme_slug<>p_theme then raise exception 'Retry payload differs' using errcode='22023'; end if;
   return jsonb_build_object('id',row_data.id,'revision',row_data.revision,'updated_at',row_data.updated_at);
  end if;
  if row_data.revision<>p_expected_revision then raise exception 'Version conflict' using errcode='40001'; end if;
  update public.ki_invitations set theme_slug=p_theme,content=p_content,revision=revision+1,last_request_id=p_request_id,updated_at=now() where id=p_id and owner_id=actor returning * into row_data;
 else
  if p_expected_revision<>0 then raise exception 'Version conflict' using errcode='40001'; end if;
  if exists(select 1 from public.ki_invitations where id=p_id) then raise exception 'Access denied' using errcode='42501'; end if;
  select count(*) into count_drafts from public.ki_invitations where owner_id=actor;
  if count_drafts>=20 then raise exception 'Draft limit reached' using errcode='P0001'; end if;
  insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id) values(p_id,actor,p_theme,p_content,1,p_request_id) returning * into row_data;
 end if;
 return jsonb_build_object('id',row_data.id,'revision',row_data.revision,'updated_at',row_data.updated_at);
end $$;
revoke all on function public.ki_save_draft(uuid,text,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.ki_save_draft(uuid,text,jsonb,integer,uuid) to authenticated;


-- Missing/non-owned IDs produce the same response. Never reveals another owner's row.
-- Revision and the same owner lock serialize deletion against save/order creation.
create or replace function public.ki_delete_draft(p_id uuid,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed email required' using errcode='42501'; end if;
 if p_id is null or p_expected_revision is null or p_expected_revision<1 then raise exception 'Invalid draft reference' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into row_data from public.ki_invitations where id=p_id and owner_id=actor for update;
 if not found then return jsonb_build_object('deleted',true); end if;
 if row_data.revision<>p_expected_revision then raise exception 'Version conflict' using errcode='40001'; end if;
 if exists(select 1 from public.ki_orders where invitation_id=p_id) then raise exception 'Draft linked to order' using errcode='P0002'; end if;
 insert into public.ki_deleted_drafts(id,owner_id) values(p_id,actor) on conflict(id) do nothing;
 delete from public.ki_invitations where id=p_id and owner_id=actor;
 -- Media is intentionally retained, because another draft may reference it.
 return jsonb_build_object('deleted',true);
end $$;
revoke all on function public.ki_delete_draft(uuid,integer) from public,anon,authenticated;
grant execute on function public.ki_delete_draft(uuid,integer) to authenticated;

-- Update only the app's named policy; do not silently erase foreign policies.
alter policy ki_media_owner_insert on storage.objects to authenticated
with check(bucket_id='ki-media' and (select public.ki_has_confirmed_email()) and name ~ ('^'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg|png)$'));

-- Diagnostic metadata is admin-only. This is a configuration inspection, not a penetration test.
create or replace function public.ki_system_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare rls_rows jsonb; storage_extra integer; application_extra integer;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('table',expected.name,'enabled',coalesce(c.relrowsecurity,false)) order by expected.name)
 into rls_rows
 from unnest(array['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts']) as expected(name)
 left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=expected.name and c.relkind='r';
 select count(*) into storage_extra from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('ki_media_owner_insert','ki_media_owner_select');
 select count(*) into application_extra from pg_policies where schemaname='public' and tablename in ('ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts')
 and policyname not in ('ki_settings_public_read','ki_templates_public_read','ki_drafts_owner_read','ki_orders_owner_or_admin_read','ki_events_admin_read');
 return jsonb_build_object(
  'schema_version',2,'tables_rls',rls_rows,
  'storage_private',exists(select 1 from storage.buckets where id='ki-media' and public=false),
  'storage_limit_ok',exists(select 1 from storage.buckets where id='ki-media' and file_size_limit>0 and file_size_limit<=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp'] and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']),
  'storage_owner_policies_present',(select count(*)=2 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('ki_media_owner_insert','ki_media_owner_select')),
  'storage_extra_policies',storage_extra,'application_extra_policies',application_extra,
  'admin_grants_restricted',not(has_table_privilege('authenticated','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'draft_direct_writes_restricted',not(has_table_privilege('authenticated','public.ki_invitations','INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_invitations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'order_requests_enabled',coalesce((select accept_order_requests from public.ki_settings where id=1),false)
 );
end $$;
revoke all on function public.ki_system_status() from public,anon,authenticated;
grant execute on function public.ki_system_status() to authenticated;

-- Public readiness exposes only the app schema number, never customer/admin details.
create or replace function public.ki_schema_version() returns integer
language sql stable security invoker set search_path='' as $$ select 2; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst, 'reload schema';
commit;

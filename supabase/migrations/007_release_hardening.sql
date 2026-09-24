-- Stage 7: server-only public gateway + distributed request budgets. Dedicated Invitation project only.
-- Additive migration. Does NOT enable checkout, publishing or RSVP; does NOT rewrite customer content.
begin;
do $$ begin
 if public.ki_schema_version() not in (6,7) then raise exception 'Install through 006 before stage 7'; end if;
end $$;
create table if not exists public.ki_public_rate_limits (
 scope text not null check(scope in ('page','guest','respond','wishes','media')),
 identity_hash text not null check(identity_hash ~ '^[0-9a-f]{64}$'),
 window_started timestamptz not null,
 hits integer not null check(hits between 1 and 600),
 updated_at timestamptz not null,
 primary key(scope,identity_hash)
);
create index if not exists ki_public_rate_expiry on public.ki_public_rate_limits(updated_at);
alter table public.ki_public_rate_limits enable row level security;
revoke all on public.ki_public_rate_limits from public,anon,authenticated;
-- RPC receives ONLY a server-generated daily HMAC of the trusted network identity, never raw IP/token/name.
create or replace function public.ki_take_public_rate(p_scope text,p_identity text) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s'
as $$
declare t timestamptz:=clock_timestamp(); cap integer; used integer; existing public.ki_public_rate_limits; retry integer;
begin
 cap:=case p_scope when 'page' then 120 when 'guest' then 120 when 'respond' then 60 when 'wishes' then 120 when 'media' then 600 else null end;
 if cap is null or p_identity is null or p_identity !~ '^[0-9a-f]{64}$' then raise exception 'Invalid rate key' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('ki-rate:'||p_scope||':'||p_identity,0));
 select * into existing from public.ki_public_rate_limits where scope=p_scope and identity_hash=p_identity for update;
 if not found then
  -- Serialize creation only, so a flood cannot create an unbounded table. Existing-key calls use row locks.
  perform pg_advisory_xact_lock(hashtextextended('ki-rate-new-key',0));
  t:=clock_timestamp();
  delete from public.ki_public_rate_limits where (scope,identity_hash) in
   (select scope,identity_hash from public.ki_public_rate_limits where updated_at<t-interval '24 hours' order by updated_at limit 1000 for update skip locked);
  if (select count(*) from public.ki_public_rate_limits)>=50000 then raise exception 'Rate storage capacity reached' using errcode='P7001'; end if;
  insert into public.ki_public_rate_limits(scope,identity_hash,window_started,hits,updated_at) values(p_scope,p_identity,t,1,t);
  return jsonb_build_object('allowed',true,'retry_after',0,'remaining',cap-1);
 end if;
 t:=clock_timestamp();
 if t>=existing.window_started+interval '60 seconds' or t<existing.window_started then
  update public.ki_public_rate_limits set window_started=t,hits=1,updated_at=t where scope=p_scope and identity_hash=p_identity;
  return jsonb_build_object('allowed',true,'retry_after',0,'remaining',cap-1);
 end if;
 if existing.hits>=cap then
  retry:=greatest(1,least(60,ceil(extract(epoch from existing.window_started+interval '60 seconds'-t))::integer));
  return jsonb_build_object('allowed',false,'retry_after',retry,'remaining',0);
 end if;
 used:=existing.hits+1;
 update public.ki_public_rate_limits set hits=used,updated_at=t where scope=p_scope and identity_hash=p_identity;
 return jsonb_build_object('allowed',true,'retry_after',0,'remaining',cap-used);
end $$;
revoke all on function public.ki_take_public_rate(text,text) from public,anon,authenticated;
grant execute on function public.ki_take_public_rate(text,text) to service_role;

-- Close the direct Data API path. All content/token/consent/expiry validation inside these RPCs remains.
revoke all on function public.ki_public_invitation(text) from public,anon,authenticated;
revoke all on function public.ki_guest_context(text,text) from public,anon,authenticated;
revoke all on function public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean) from public,anon,authenticated;
revoke all on function public.ki_public_wishes(text,bigint) from public,anon,authenticated;
grant execute on function public.ki_public_invitation(text) to service_role;
grant execute on function public.ki_guest_context(text,text) to service_role;
grant execute on function public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean) to service_role;
grant execute on function public.ki_public_wishes(text,bigint) to service_role;

create or replace function public.ki_launch_audit() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare restricted boolean; enabled_rls boolean; fingerprint text;
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Confirmed admin required' using errcode='42501';end if;
 select not exists(select 1 from unnest(array['anon','authenticated']) r(role_name),unnest(array[
  'public.ki_public_invitation(text)','public.ki_guest_context(text,text)',
  'public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean)',
  'public.ki_public_wishes(text,bigint)','public.ki_take_public_rate(text,text)'
 ]) f(signature) where has_function_privilege(r.role_name,f.signature,'EXECUTE')) into restricted;
 select c.relrowsecurity into enabled_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='ki_public_rate_limits';
 -- Compare exported function definitions/grants in a release review; no personal rows or key hashes returned.
 select md5(string_agg(p.oid::regprocedure::text||':'||pg_get_functiondef(p.oid),E'\n' order by p.oid::regprocedure::text)) into fingerprint
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ki_%';
 return jsonb_build_object('schema_version',public.ki_schema_version(),'public_rpc_server_only',restricted,
  'rate_rls',coalesce(enabled_rls,false),'rate_table_private',not exists(select 1 from unnest(array['anon','authenticated']) r(role_name) where has_table_privilege(r.role_name,'public.ki_public_rate_limits','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'rate_service_grant',has_function_privilege('service_role','public.ki_take_public_rate(text,text)','EXECUTE'),
  'public_service_grants',not exists(select 1 from unnest(array['public.ki_public_invitation(text)','public.ki_guest_context(text,text)','public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean)','public.ki_public_wishes(text,bigint)','public.ki_public_photo(text,integer,integer)']) f(signature) where not has_function_privilege('service_role',f.signature,'EXECUTE')),
  'sql_fingerprint',fingerprint,'checked_at',now());
end $$;
revoke all on function public.ki_launch_audit() from public,anon,authenticated;
grant execute on function public.ki_launch_audit() to authenticated;

create or replace function public.ki_system_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare rls_rows jsonb; storage_extra integer; application_extra integer;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('table',expected.name,'enabled',coalesce(c.relrowsecurity,false)) order by expected.name)
 into rls_rows
 from unnest(array['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits']) as expected(name)
 left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=expected.name and c.relkind='r';
 select count(*) into storage_extra from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('ki_media_owner_insert','ki_media_owner_select');
 select count(*) into application_extra from pg_policies where schemaname='public' and tablename in ('ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits')
 and policyname not in ('ki_settings_public_read','ki_templates_public_read','ki_drafts_owner_read','ki_orders_owner_or_admin_read','ki_events_admin_read','ki_commerce_read','ki_sales_read','ki_publications_read','ki_sale_events_read');
 return jsonb_build_object(
  'schema_version',7,
  'cms_writes_restricted',not exists(select 1 from unnest(array['anon','authenticated']) r(role),unnest(array['ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits']) t(name) where has_table_privilege(r.role,'public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'cms_admin_rpc_private',not has_function_privilege('anon','public.ki_cms_read()','EXECUTE') and not has_function_privilege('anon','public.ki_cms_mutate(text,integer,uuid,text,jsonb)','EXECUTE'),
  'cms_publication_exists',exists(select 1 from public.ki_cms where id=1),'tables_rls',rls_rows,
  'storage_private',exists(select 1 from storage.buckets where id='ki-media' and public=false),
  'storage_limit_ok',exists(select 1 from storage.buckets where id='ki-media' and file_size_limit>0 and file_size_limit<=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp'] and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']),
  'storage_owner_policies_present',(select count(*)=2 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('ki_media_owner_insert','ki_media_owner_select')),
  'storage_extra_policies',storage_extra,'application_extra_policies',application_extra,
  'admin_grants_restricted',not(has_table_privilege('authenticated','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'draft_direct_writes_restricted',not(has_table_privilege('authenticated','public.ki_invitations','INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_invitations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'commerce_direct_writes_restricted',not exists(select 1 from unnest(array['ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'public_photo_rpc_private',not(has_function_privilege('anon','public.ki_public_photo(text,integer,integer)','EXECUTE') or has_function_privilege('authenticated','public.ki_public_photo(text,integer,integer)','EXECUTE')),
  'checkout_enabled',coalesce((select checkout_enabled from public.ki_commerce_settings where id=1),false),
  'publishing_enabled',coalesce((select publishing_enabled from public.ki_commerce_settings where id=1),false),
  'guest_direct_access_restricted',not exists(select 1 from unnest(array['ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'rsvp_enabled',coalesce((select enabled from public.ki_guest_platform where id=1),false),
  'order_requests_enabled',coalesce((select accept_order_requests from public.ki_settings where id=1),false)
 );
end $$;
revoke all on function public.ki_system_status() from public,anon,authenticated;
grant execute on function public.ki_system_status() to authenticated;





create or replace function public.ki_schema_version() returns integer
language sql stable set search_path='' as $$ select 7; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst,'reload schema';
commit;

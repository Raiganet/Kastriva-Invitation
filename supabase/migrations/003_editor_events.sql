-- Kastriva Invitation v1.3.0: additive multi-event editor support.
-- On the SAME dedicated project: run 001, 002, then 003. Existing rows/media are untouched.
begin;
do $$ begin
 if to_regclass('public.ki_deleted_drafts') is null or to_regprocedure('public.ki_schema_version()') is null then
  raise exception 'Install 001 and 002 before 003';
 end if;
 if public.ki_schema_version() not in (2,3) then raise exception 'Unsupported schema version for migration 003'; end if;
end $$;

-- Keep the original base validation as a non-public, reusable helper.
create or replace function public.ki_valid_base_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare f record; photo jsonb; date_value text; allowed text[] := array['groom','bride','groomParents','brideParents','eventDate','eventTime','endTime','timezone','venue','address','mapUrl','opening','story','photoPaths'];
begin
 if p_content is null or p_owner is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 if not (p_content ?& allowed) or exists(select 1 from jsonb_object_keys(p_content) as keys(key) where not(key=any(allowed))) then return false; end if;
 for f in select * from (values ('groom',100),('bride',100),('groomParents',200),('brideParents',200),('eventDate',10),('eventTime',5),('endTime',5),('timezone',20),('venue',200),('address',500),('mapUrl',1000),('opening',1000),('story',4000)) as lim(key,max_len) loop
  if jsonb_typeof(p_content->f.key)<>'string' or char_length(p_content->>f.key)>f.max_len then return false; end if;
 end loop;
 if (p_content->>'timezone') not in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura') then return false; end if;
 if (p_content->>'eventTime') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (p_content->>'endTime') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (p_content->>'endTime') <= (p_content->>'eventTime') then return false; end if;
 date_value:=p_content->>'eventDate';
 if date_value<>'' then
  if date_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or substring(date_value,1,4)::integer<2020 or to_char(to_date(date_value,'YYYY-MM-DD'),'YYYY-MM-DD')<>date_value then return false; end if;
 end if;
 if (p_content->>'mapUrl')<>'' and (p_content->>'mapUrl') !~ '^https://[^[:space:]@/]+(/[^[:space:]]*)?$' then return false; end if;
 if jsonb_typeof(p_content->'photoPaths')<>'array' or jsonb_array_length(p_content->'photoPaths')>6 then return false; end if;
 for photo in select value from jsonb_array_elements(p_content->'photoPaths') loop
  if jsonb_typeof(photo)<>'string' or (photo#>>'{}') !~ ('^'||p_owner::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg|png)$') then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.ki_valid_base_content(jsonb,uuid) from public,anon,authenticated;


create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare base jsonb; events jsonb; event jsonb; projected jsonb; field text;
 allowed text[]:=array['id','label','eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 event_fields text[]:=array['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 ids text[]:=array[]::text[];
begin
 if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 base:=p_content-'events';
 if not public.ki_valid_base_content(base,p_owner) then return false; end if;
 if (select count(*) from jsonb_array_elements(base->'photoPaths')) <>
    (select count(distinct value) from jsonb_array_elements(base->'photoPaths')) then return false; end if;
 -- Old drafts remain valid; migration does not force-write or delete their contents.
 if not (p_content ? 'events') then return true; end if;
 events:=p_content->'events';
 if jsonb_typeof(events)<>'array' then return false; end if;
 if jsonb_array_length(events)<1 or jsonb_array_length(events)>3 then return false; end if;
 for event in select value from jsonb_array_elements(events) loop
  if jsonb_typeof(event)<>'object' then return false; end if;
  if not (event ?& allowed) or exists(select 1 from jsonb_object_keys(event) as keys(key) where not(key=any(allowed))) then return false; end if;
  if jsonb_typeof(event->'id')<>'string' or (event->>'id') !~ '^[a-z0-9-]{1,64}$' or (event->>'id')=any(ids) then return false; end if;
  ids:=array_append(ids,event->>'id');
  if jsonb_typeof(event->'label')<>'string' or char_length(event->>'label')>80 then return false; end if;
  projected:=base;
  foreach field in array event_fields loop projected:=jsonb_set(projected,array[field],event->field); end loop;
  if not public.ki_valid_base_content(projected,p_owner) then return false; end if;
 end loop;
 -- Existing dashboard/order readers must see the exact first event, not contradictory fields.
 foreach field in array event_fields loop
  if base->field is distinct from (events->0)->field then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.ki_valid_content(jsonb,uuid) from public,anon,authenticated;

-- Stage-2 save/delete RPCs are retained (confirmed email, revision, retry, tombstones, media ownership).
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
  'schema_version',3,'tables_rls',rls_rows,
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


create or replace function public.ki_schema_version() returns integer
language sql stable security invoker set search_path='' as $$ select 3; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst, 'reload schema';
commit;

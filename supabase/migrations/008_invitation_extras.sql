-- Optional invitation music and gift accounts. Existing documents remain valid.
-- Additive content validation only. Keeps schema capability 7 and all existing
-- function ACLs, RLS, publication consent, ownership, and paid/expiry gates.
begin;
do $$ begin
 if to_regprocedure('public.ki_valid_content(jsonb,uuid)') is null or public.ki_schema_version()<>7 then
  raise exception 'Apply migrations 001-007 first';
 end if;
end $$;
create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare base jsonb; events jsonb; event jsonb; projected jsonb; field text; gift jsonb;
 allowed text[]:=array['id','label','eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 event_fields text[]:=array['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 ids text[]:=array[]::text[];
begin
 if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 if p_content ? 'music' and (jsonb_typeof(p_content->'music') is distinct from 'string' or p_content->>'music' not in ('none','serenade')) then return false; end if;
 if p_content ? 'gifts' then
  if jsonb_typeof(p_content->'gifts') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_content->'gifts')>3 then return false; end if;
  for gift in select value from jsonb_array_elements(p_content->'gifts') loop
   if jsonb_typeof(gift) is distinct from 'object' then return false; end if;
   if not(gift ?& array['bank','account','holder']) or exists(select 1 from jsonb_object_keys(gift) as keys(key) where key not in ('bank','account','holder')) then return false; end if;
   if jsonb_typeof(gift->'bank') is distinct from 'string' or char_length(gift->>'bank')>60
    or jsonb_typeof(gift->'holder') is distinct from 'string' or char_length(gift->>'holder')>100
    or jsonb_typeof(gift->'account') is distinct from 'string' or (gift->>'account') !~ '^[0-9]{0,30}$' then return false; end if;
   if (gift->>'bank') ~ '[[:cntrl:]]' or (gift->>'holder') ~ '[[:cntrl:]]' then return false; end if;
  end loop;
 end if;
 base:=p_content-'events'-'music'-'gifts';
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

create or replace function public.ki_publishable_content(c jsonb,u uuid) returns boolean
language plpgsql immutable set search_path='' as $$
declare e jsonb; gift jsonb;
begin
 if not public.ki_valid_content(c,u) or trim(c->>'groom')='' or trim(c->>'bride')='' then return false; end if;
 if c ? 'events' then
  for e in select value from jsonb_array_elements(c->'events') loop
   if trim(e->>'eventDate')='' or trim(e->>'label')='' or trim(e->>'venue')='' or trim(e->>'address')='' then return false; end if;
  end loop;
 else
  if trim(c->>'eventDate')='' or trim(c->>'venue')='' or trim(c->>'address')='' then return false; end if;
 end if;
 for gift in select value from jsonb_array_elements(coalesce(c->'gifts','[]'::jsonb)) loop
  if trim(gift->>'bank')='' or trim(gift->>'holder')='' or (gift->>'account') !~ '^[0-9]{5,30}$' then return false; end if;
 end loop;
 return true;
end $$;

-- Synthetic documents only: no customer records or configuration are written.
do $$
declare owner uuid:='00000000-0000-4000-8000-000000000001';
 base jsonb:='{"groom":"Example","bride":"Example","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Example","address":"Example","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 valid jsonb;
begin
 valid:=base||'{"music":"serenade","gifts":[{"bank":"Example","account":"0012345678","holder":"Example"}]}'::jsonb;
 if not public.ki_valid_content(base,owner) or not public.ki_publishable_content(valid,owner) then raise exception 'Valid document rejected'; end if;
 if public.ki_valid_content(base||'{"music":"https://invalid.example/song.mp3"}'::jsonb,owner) then raise exception 'Unknown music allowed'; end if;
 if public.ki_valid_content(base||'{"gifts":null}'::jsonb,owner) then raise exception 'Null gifts allowed'; end if;
 if public.ki_valid_content(base||'{"gifts":[{"bank":"Example","account":"1e10","holder":"Example"}]}'::jsonb,owner) then raise exception 'Invalid number allowed'; end if;
 if public.ki_valid_content(valid||jsonb_build_object('gifts',(valid->'gifts')||(valid->'gifts')||(valid->'gifts')||(valid->'gifts')),owner) then raise exception 'Gift limit missing'; end if;
 if public.ki_publishable_content(base||'{"gifts":[{"bank":"","account":"","holder":""}]}'::jsonb,owner) then raise exception 'Incomplete gifts publishable'; end if;
 if public.ki_valid_content(valid||'{"private_field":"bad"}'::jsonb,owner) then raise exception 'Unknown field allowed'; end if;
 raise notice 'PASS: legacy content, gift and music validation, incomplete publication gate';
end $$;
notify pgrst, 'reload schema';
commit;

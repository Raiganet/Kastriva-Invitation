-- Per-invitation music volume slider. Additive validator upgrade after 016.
-- Does not rewrite existing drafts, orders, publications, CMS content, RSVP, or wishes.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
do $$ begin
 if public.ki_schema_version()<>7 or (public.ki_feature_readiness()->>'diagnostics_migration')::integer<>16 then raise exception 'Requires migrations through 016'; end if;
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
 if p_content ? 'music' and (jsonb_typeof(p_content->'music') is distinct from 'string' or p_content->>'music' not in ('none','serenade','starlight','moonlight','ever-after','ocean-vows','sakura-promise','celestial-waltz','cinematic-bloom')) then return false; end if;
 if p_content ? 'musicVolume' and (jsonb_typeof(p_content->'musicVolume') is distinct from 'number' or (p_content->>'musicVolume')::numeric<>trunc((p_content->>'musicVolume')::numeric) or (p_content->>'musicVolume')::numeric not between 0 and 100) then return false; end if;
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
 base:=p_content-'events'-'music'-'musicVolume'-'gifts';
 if not public.ki_valid_base_content(base,p_owner) then return false; end if;
 if (select count(*) from jsonb_array_elements(base->'photoPaths')) <>
    (select count(distinct value) from jsonb_array_elements(base->'photoPaths')) then return false; end if;
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
 foreach field in array event_fields loop
  if base->field is distinct from (events->0)->field then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;

comment on function public.ki_valid_content(jsonb,uuid) is 'Validates invitation content including built-in music and optional integer musicVolume 0-100; migration 017.';
notify pgrst,'reload schema';
commit;

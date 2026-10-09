-- Add four original heritage instrumentals and automatic theme pairing.
-- Extends only the existing music allowlist; no customer rows or grants change.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
do $$
declare
 probe_owner uuid:='00000000-0000-4000-8000-000000000001';
 base jsonb:='{"groom":"A","bride":"B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
begin
 if public.ki_schema_version()<>7 or to_regprocedure('public.ki_valid_theme_content(jsonb,uuid,text)') is null
    or not public.ki_valid_content(base||'{"music":"serenade","musicVolume":75}'::jsonb,probe_owner)
 then raise exception 'Requires migrations through non_wedding_orders'; end if;
end $$;

create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare base jsonb; events jsonb; event jsonb; projected jsonb; field text; gift jsonb;
 allowed text[]:=array['id','label','eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 event_fields text[]:=array['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 ids text[]:=array[]::text[];
 allowed_music text[]:=array['theme','priangan-dew','minang-radiance','pendopo-lerem','bali-sunrise','none','serenade','starlight','moonlight','ever-after','ocean-vows','sakura-promise','celestial-waltz','cinematic-bloom','wedding-01','wedding-02','wedding-03','wedding-04','wedding-05','wedding-06','wedding-07','wedding-08','wedding-09','wedding-10','wedding-11','wedding-12','wedding-13','wedding-14','wedding-15','wedding-16','wedding-17','wedding-18','wedding-19','wedding-20','wedding-21','wedding-22','wedding-23','wedding-24','wedding-25','wedding-26','wedding-27','wedding-28','wedding-29','wedding-30','wedding-31','wedding-32','wedding-33','wedding-34','wedding-35','wedding-36','wedding-37','wedding-38','wedding-39','wedding-40','wedding-41','wedding-42','wedding-43','wedding-44','wedding-45','wedding-46','wedding-47','wedding-48','wedding-49','wedding-50','wedding-51','wedding-52','wedding-53','wedding-54','wedding-55','wedding-56','wedding-57','wedding-58','wedding-59','wedding-60','wedding-61','wedding-62','wedding-63','aqiqah-01','aqiqah-02'];
begin
 if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 if p_content ? 'music' and (jsonb_typeof(p_content->'music') is distinct from 'string' or not((p_content->>'music')=any(allowed_music))) then return false; end if;
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

comment on function public.ki_valid_content(jsonb,uuid) is 'Validates invitation content including automatic theme music, four heritage instrumentals, original and imported tracks; wedding_instrumentals.';
notify pgrst,'reload schema';
commit;

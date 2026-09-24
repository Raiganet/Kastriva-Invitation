-- OPTIONAL: run in the SQL Editor of the dedicated STAGING project after 003.
-- Pure validator checks only: no customer rows, Storage files, grants, or schema are modified.
-- This script has NOT been executed by the package author against PostgreSQL/Supabase.
-- Requires the SQL Editor role because validators are intentionally not exposed to API clients.
begin;
do $$
declare
 owner uuid := '01234567-89ab-4def-8123-456789abcdef';
 base jsonb := '{"groom":"Nama uji","bride":"Pasangan uji","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"09:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Lokasi uji","address":"Alamat uji","mapUrl":"https://maps.google.com/","opening":"","story":"","photoPaths":[]}'::jsonb;
 first_event jsonb; second_event jsonb; content jsonb; invalid jsonb; fld text;
begin
 if public.ki_schema_version()not in (3,4,5,6) then raise exception 'Requires schema 3–6'; end if;
 if public.ki_valid_content(base,owner) is distinct from true then raise exception 'Legacy draft rejected'; end if;
 first_event:=jsonb_build_object('id','akad','label','Akad');
 foreach fld in array array['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'] loop
  first_event:=jsonb_set(first_event,array[fld],base->fld);
 end loop;
 second_event:=first_event||jsonb_build_object('id','resepsi','label','Resepsi','eventDate','2027-12-26','venue','Taman uji');
 content:=base||jsonb_build_object('events',jsonb_build_array(first_event,second_event));
 if public.ki_valid_content(content,owner) is distinct from true then raise exception 'Two valid events rejected'; end if;
 invalid:=jsonb_set(content,'{events,1,id}','"akad"');
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Duplicate event accepted'; end if;
 invalid:=jsonb_set(content,'{events,0,eventDate}','"2027-12-26"');
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Mismatched primary event accepted'; end if;
 invalid:=jsonb_set(content,'{events,1,endTime}','"08:00"');
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Invalid hours accepted'; end if;
 invalid:=jsonb_set(content,'{events,1,owner_id}',to_jsonb(owner::text));
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Unknown event key accepted'; end if;
 invalid:=jsonb_set(content,'{events}','[]');
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Empty event list accepted'; end if;
 invalid:=jsonb_set(content,'{events}',jsonb_build_array(first_event,second_event,second_event,second_event));
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Four events accepted'; end if;
 invalid:=jsonb_set(content,'{events,1,eventDate}','"2027-02-29"');
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Invalid leap day accepted'; end if;
 invalid:=jsonb_set(content,'{photoPaths}',jsonb_build_array(owner::text||'/11234567-89ab-4def-8123-456789abcdef.webp',owner::text||'/11234567-89ab-4def-8123-456789abcdef.webp'));
 if public.ki_valid_content(invalid,owner) is distinct from false then raise exception 'Duplicate photo reference accepted'; end if;
 if public.ki_valid_content(content,null) is distinct from false then raise exception 'Null owner accepted'; end if;
 raise notice 'PASS: 11 pure validator checks. This does not test RLS, HTTP, authentication, or Storage.';
end $$;
rollback;

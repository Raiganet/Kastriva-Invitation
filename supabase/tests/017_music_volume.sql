begin;
do $$
declare
 probe_owner uuid:='00000000-0000-4000-8000-000000000001';
 base jsonb:='{"groom":"A","bride":"B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 volume numeric;
begin
 if not public.ki_valid_content(base,probe_owner) then raise exception 'FAIL legacy content without volume';end if;
 foreach volume in array array[0,25,75,100]::numeric[] loop
  if not public.ki_valid_content(base||jsonb_build_object('music','serenade','musicVolume',volume),probe_owner) then raise exception 'FAIL allowed volume %',volume;end if;
 end loop;
 foreach volume in array array[-1,101,75.5]::numeric[] loop
  if public.ki_valid_content(base||jsonb_build_object('music','serenade','musicVolume',volume),probe_owner) then raise exception 'FAIL invalid volume %',volume;end if;
 end loop;
 if public.ki_valid_content(base||'{"music":"serenade","musicVolume":"75"}'::jsonb,probe_owner) then raise exception 'FAIL string volume';end if;
 if public.ki_valid_content(base||'{"music":"serenade","musicVolume":null}'::jsonb,probe_owner) then raise exception 'FAIL null volume';end if;
 raise notice 'PASS: optional per-invitation music volume integer 0-100, legacy drafts preserved';
end $$;
rollback;

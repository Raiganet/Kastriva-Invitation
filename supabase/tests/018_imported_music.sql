begin;
do $$
declare
 probe_owner uuid:='00000000-0000-4000-8000-000000000001';
 base jsonb:='{"groom":"A","bride":"B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 music text;
begin
 foreach music in array array['wedding-01','wedding-02','wedding-03','wedding-04','wedding-05','wedding-06','wedding-07','wedding-08','wedding-09','wedding-10','wedding-11','wedding-12','wedding-13','wedding-14','wedding-15','wedding-16','wedding-17','wedding-18','wedding-19','wedding-20','wedding-21','wedding-22','wedding-23','wedding-24','wedding-25','wedding-26','wedding-27','wedding-28','wedding-29','wedding-30','wedding-31','wedding-32','wedding-33','wedding-34','wedding-35','wedding-36','wedding-37','wedding-38','wedding-39','wedding-40','wedding-41','wedding-42','wedding-43','wedding-44','wedding-45','wedding-46','wedding-47','wedding-48','wedding-49','wedding-50','wedding-51','wedding-52','wedding-53','wedding-54','wedding-55','wedding-56','wedding-57','wedding-58','wedding-59','wedding-60','wedding-61','wedding-62','wedding-63','aqiqah-01','aqiqah-02'] loop
  if not public.ki_valid_content(base||jsonb_build_object('music',music,'musicVolume',75),probe_owner)
   then raise exception 'FAIL imported music %',music; end if;
 end loop;
 if public.ki_valid_content(base||'{"music":"wedding-64","musicVolume":75}'::jsonb,probe_owner) then raise exception 'FAIL unapproved slot';end if;
 if public.ki_valid_content(base||'{"music":"https://invalid.example/song.mp3","musicVolume":75}'::jsonb,probe_owner) then raise exception 'FAIL arbitrary URL';end if;
 if not public.ki_valid_content(base||'{"music":"serenade","musicVolume":100}'::jsonb,probe_owner) then raise exception 'FAIL original compatibility';end if;
 if public.ki_valid_content(base||'{"music":"wedding-01","musicVolume":101}'::jsonb,probe_owner) then raise exception 'FAIL volume guard';end if;
 raise notice 'PASS: 65 imported music slots + original music + volume validation';
end $$;
rollback;

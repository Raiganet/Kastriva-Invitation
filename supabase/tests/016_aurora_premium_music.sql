begin;
do $$
declare
 probe_owner uuid:='00000000-0000-4000-8000-000000000001';
 base jsonb:='{"groom":"A","bride":"B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 report jsonb;
 music text;
begin
 if (select count(*) from public.ki_templates where slug='aurora-modern' and category='pernikahan')<>1 then raise exception 'FAIL aurora renderer';end if;
 if jsonb_array_length(public.ki_cms_catalog())<>16 then raise exception 'FAIL 16-theme catalog';end if;
 if not public.ki_cms_valid_document((select draft from public.ki_cms where id=1)) or not public.ki_cms_valid_document((select published from public.ki_cms where id=1)) then raise exception 'FAIL CMS generation';end if;
 foreach music in array array['serenade','starlight','moonlight','ever-after','ocean-vows','sakura-promise','celestial-waltz','cinematic-bloom'] loop
  if not public.ki_valid_content(base||jsonb_build_object('music',music),probe_owner) then raise exception 'FAIL allowed music %',music;end if;
 end loop;
 if public.ki_valid_content(base||'{"music":"https://invalid.example/song.mp3"}'::jsonb,probe_owner) then raise exception 'FAIL arbitrary music URL';end if;
 report:=public.ki_feature_readiness();
 if report->>'diagnostics_migration'<>'16' or report->>'known_templates'<>'16' then raise exception 'FAIL readiness version/count';end if;
 if report->'capabilities'->>'aurora_premium_music'<>'true' or report->'capabilities'->>'cms_catalog_complete'<>'true' then raise exception 'FAIL aurora readiness capability';end if;
 raise notice 'PASS: Aurora Luxe Motion, 8 music tracks, CMS history compatibility and readiness 016';
end $$;
rollback;

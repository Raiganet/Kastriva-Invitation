begin;
do $$ begin
 if current_database()<>'ki_isolated_test' then raise exception 'Isolated database required'; end if;
end $$;
do $$
declare
 u uuid:='00000000-0000-4000-8000-000000000001';
 c jsonb:='{"groom":"A","bride":"B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 track text;
begin
 foreach track in array array['theme','priangan-dew','minang-radiance','pendopo-lerem','bali-sunrise','none','serenade','moonlight','wedding-01','aqiqah-01'] loop
  if not public.ki_valid_theme_content(c||jsonb_build_object('music',track,'musicVolume',45),u,'adat-sunda') then raise exception 'Music save validation failed: %',track; end if;
  if not public.ki_publishable_theme_content(c||jsonb_build_object('music',track,'musicVolume',45),u,'adat-jawa') then raise exception 'Music publication validation failed: %',track; end if;
 end loop;
 if not public.ki_valid_content(c,u) then raise exception 'Legacy music omission rejected'; end if;
 foreach track in array array['unknown-adat','https://invalid.example/music.mp3','wedding-64'] loop
  if public.ki_valid_content(c||jsonb_build_object('music',track),u) then raise exception 'Unregistered music accepted'; end if;
 end loop;
 if public.ki_valid_content(c||'{"music":"theme","musicVolume":101}'::jsonb,u) then raise exception 'Volume guard lost'; end if;
 if public.ki_valid_content(c||'{"music":null}'::jsonb,u) then raise exception 'Null music accepted'; end if;
 if public.ki_valid_content(c||'{"music":"bali-sunrise","photoPaths":["other-user/photo.jpg"]}'::jsonb,u) then raise exception 'Photo ownership guard lost'; end if;
 if public.ki_valid_content(c||'{"music":"theme","unexpected":true}'::jsonb,u) then raise exception 'Unknown field guard lost'; end if;
 if public.ki_valid_theme_content(c||'{"music":"theme"}'::jsonb,u,'not-a-template') then raise exception 'Unknown theme accepted'; end if;
 if exists(select 1 from pg_proc where oid='public.ki_valid_content(jsonb,uuid)'::regprocedure and prosecdef) then raise exception 'Validator became security definer'; end if;
 raise notice 'PASS wedding music: save/publish, legacy selections, volume and ownership guards';
end $$;
-- Exercise the actual save -> checkout -> paid publication -> public snapshot boundary.
-- Synthetic accounts only, rolled back at the end of this isolated fixture.
create temporary table music_context(owner_id uuid,admin_id uuid,body jsonb,revision integer,days integer) on commit drop;
insert into music_context select gen_random_uuid(),gen_random_uuid(),
 '{"groom":"Arif","bride":"Nadia","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[],"musicVolume":45}'::jsonb,
 revision,active_days from public.ki_commerce_settings where id=1;
grant select on music_context to authenticated;
create temporary table music_results(slug text,track text) on commit drop;
grant select,insert on music_results to authenticated;
grant select on music_results to service_role;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
 select id,'music-fixture-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}','{}',now(),now()
 from music_context cross join lateral unnest(array[owner_id,admin_id]) x(id);
insert into public.ki_admins(user_id) select admin_id from music_context;
update public.ki_commerce_settings set checkout_enabled=true,publishing_enabled=true,bank_name='FIXTURE',bank_account='0000000000',bank_holder='DO NOT TRANSFER' where id=1;
update public.ki_templates set active=true where slug='adat-sunda';
set local role authenticated;
do $$ declare c record; track text; content jsonb; d uuid; sale uuid; price integer; begin
 select * into c from music_context;
 select t.price into price from public.ki_templates t where slug='adat-sunda';
 foreach track in array array['theme','priangan-dew','minang-radiance','pendopo-lerem','bali-sunrise'] loop
  perform set_config('request.jwt.claim.sub',c.owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',c.owner_id,'role','authenticated')::text,true);
  content:=c.body||jsonb_build_object('music',track);d:=gen_random_uuid();
  perform public.ki_save_draft(d,'adat-sunda',content,0,gen_random_uuid());
  if (select i.content->>'music' from public.ki_invitations i where i.id=d)<>track then raise exception 'Saved track changed'; end if;
  sale:=(public.ki_checkout(d,1,'adat-sunda',price,c.days,c.revision,'Fixture','6281234567890',gen_random_uuid())->>'id')::uuid;
  perform public.ki_sale_action(sale,'submit_payment',1,gen_random_uuid(),'','FIXTURE',0,false);
  perform set_config('request.jwt.claim.sub',c.admin_id::text,true);
  perform public.ki_sale_action(sale,'approve',2,gen_random_uuid(),'Fixture only','FIXTURE',price,true);
  perform set_config('request.jwt.claim.sub',c.owner_id::text,true);
  perform public.ki_publication_action(sale,'publish','music-fixture-'||track,1,0,gen_random_uuid(),true);
  insert into music_results values('music-fixture-'||track,track);
 end loop;
end $$;
reset role;
set local role service_role;
do $$ declare row record; content jsonb; begin
 for row in select * from music_results loop
  content:=public.ki_public_invitation(row.slug)->'content';
  if content->>'music' is distinct from row.track or (content->>'musicVolume')::integer is distinct from 45 then raise exception 'Music lost in public snapshot'; end if;
 end loop;
end $$;
reset role;
rollback;

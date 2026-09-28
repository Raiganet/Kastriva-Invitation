-- ISOLATED LOCAL ENGINE TEST ONLY. NEVER run this file on Supabase production.
-- Requires the ki_isolated_test database and migrations 001..013 from the local harness.
-- Synthetic paid fixtures are NOT real payments. The full file rolls all fixture changes back.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' then raise exception 'STOP: local ki_isolated_test only';end if;
 if public.ki_schema_version()<>7 or public.ki_open_wish_version()<>1 then raise exception 'Install through 013';end if;
 if exists(select 1 from auth.users where id::text like 'a9131313-1313-4313-8313-%') then raise exception 'Fixture namespace exists';end if;
 if exists(select 1 from public.ki_publications where slug='ki-general-wishes-fixture') then raise exception 'Fixture slug exists';end if;
 if (select enabled from public.ki_open_wish_platform where id=1) then raise exception 'Expected new service closed by default';end if;
end $$;
create temporary table ki_wish_ctx(a uuid,b uuid,adm uuid,draft_id uuid,sale_id uuid,wish_id uuid,private_id uuid,receipt text,first_result jsonb) on commit drop;
insert into ki_wish_ctx values('a9131313-1313-4313-8313-131313131311','a9131313-1313-4313-8313-131313131312','a9131313-1313-4313-8313-131313131313',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),repeat('a',64),null);
grant select,update on ki_wish_ctx to anon,authenticated,service_role;
create temporary table ki_wish_rsvp_before as select
 (select count(*) from public.ki_guests) as guests,(select count(*) from public.ki_rsvps) as rsvps;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'wish-fixture-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
from ki_wish_ctx cross join lateral unnest(array[a,b,adm]) x(id);
insert into public.ki_admins(user_id) select adm from ki_wish_ctx;
insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id)
select draft_id,a,'elegant-rose','{"groom":"Fixture A","bride":"Fixture B","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"FIXTURE","address":"Synthetic location","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb,1,gen_random_uuid() from ki_wish_ctx;
insert into public.ki_sales(id,owner_id,invitation_id,theme_slug,theme_name,total_price,active_days,payment_details,customer_name,customer_phone,customer_email,status,paid_at,expires_at)
select sale_id,a,draft_id,'elegant-rose','FIXTURE',150000,14,'{}'::jsonb,'Fixture Only','6281234567890','fixture@example.invalid','paid',now(),now()+interval '14 days' from ki_wish_ctx;
insert into public.ki_publications(sale_id,owner_id,slug,theme_slug,content,draft_revision)
select t.sale_id,t.a,'ki-general-wishes-fixture','elegant-rose',i.content,1 from ki_wish_ctx t join public.ki_invitations i on i.id=t.draft_id;
update public.ki_commerce_settings set publishing_enabled=true where id=1;
-- Independent of personal RSVP, which deliberately stays disabled throughout this test.
update public.ki_guest_platform set enabled=false where id=1;
set local role anon;
do $$ begin
 if public.ki_open_wish_version()<>1 then raise exception 'FAIL version';end if;
 begin perform count(*) from public.ki_open_wishes;raise exception 'FAIL direct anonymous table read';exception when insufficient_privilege then null;end;
 begin perform public.ki_open_wish_feed('ki-general-wishes-fixture');raise exception 'FAIL anonymous direct feed';exception when insufficient_privilege then null;end;
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('a',64),'Fixture','Hello',true,repeat('1',64));raise exception 'FAIL anonymous direct submit';exception when insufficient_privilege then null;end;
 raise notice 'PASS: browser roles do not bypass Next gateway';
end $$;
reset role;
set local role authenticated;
do $$ declare t record;who uuid;r jsonb;req uuid:=gen_random_uuid();begin
 select * into t from ki_wish_ctx;
 foreach who in array array[t.b,t.adm] loop
  perform set_config('request.jwt.claim.sub',who::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true);
  begin perform public.ki_open_wish_workspace(t.sale_id);raise exception 'FAIL cross-owner list';exception when insufficient_privilege then null;end;
  begin perform public.ki_open_wish_manage(t.sale_id,gen_random_uuid(),'settings',0,null,'{"accepting":true,"showing":true}'::jsonb);raise exception 'FAIL cross-owner setting';exception when insufficient_privilege then null;end;
 end loop;
 perform set_config('request.jwt.claim.sub',t.a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin perform public.ki_open_wish_admin();raise exception 'FAIL customer admin access';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.ki_open_wishes;raise exception 'FAIL direct owner table read';exception when insufficient_privilege then null;end;
 r:=public.ki_open_wish_manage(t.sale_id,req,'settings',0,null,'{"accepting":true,"showing":true}'::jsonb);
 if r<>public.ki_open_wish_manage(t.sale_id,req,'settings',0,null,'{"accepting":true,"showing":true}'::jsonb) then raise exception 'FAIL owner replay';end if;
 begin perform public.ki_open_wish_manage(t.sale_id,gen_random_uuid(),'settings',0,null,'{"accepting":false,"showing":false}'::jsonb);raise exception 'FAIL stale settings';exception when sqlstate 'P1301' then null;end;
 perform set_config('request.jwt.claim.sub',t.adm::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.adm,'role','authenticated')::text,true);
 req:=gen_random_uuid();r:=public.ki_open_wish_admin_set(req,1,true);
 if r<>public.ki_open_wish_admin_set(req,1,true) then raise exception 'FAIL admin replay';end if;
 begin perform public.ki_open_wish_admin_set(req,1,false);raise exception 'FAIL admin changed replay';exception when sqlstate 'P1306' then null;end;
 raise notice 'PASS: only owner manages content, only admin configures platform, optimistic versions/replay';
end $$;
reset role;
set local role service_role;
do $$ declare t record;r jsonb;begin
 select * into t from ki_wish_ctx;
 if not (public.ki_open_wish_feed('ki-general-wishes-fixture')->>'accepting')::boolean then raise exception 'FAIL general service depends on RSVP';end if;
 r:=public.ki_open_wish_submit('ki-general-wishes-fixture',t.wish_id,t.receipt,'Budi Fixture','Selamat untuk data uji.',true,repeat('1',64));
 if r<>public.ki_open_wish_submit('ki-general-wishes-fixture',t.wish_id,t.receipt,'Budi Fixture','Selamat untuk data uji.',true,repeat('1',64)) then raise exception 'FAIL submit replay';end if;
 update ki_wish_ctx set first_result=r;
 if jsonb_array_length(public.ki_open_wish_feed('ki-general-wishes-fixture')->'items')<>0 then raise exception 'FAIL pending becomes public';end if;
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',t.wish_id,t.receipt,'Budi Fixture','Changed payload',true,repeat('1',64));raise exception 'FAIL changed replay';exception when sqlstate 'P1306' then null;end;
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('b',64),'Fixture','Next',true,repeat('1',64));raise exception 'FAIL cooldown';exception when sqlstate 'P1304' then null;end;
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('b',64),'Fixture',repeat('💐',251),true,repeat('2',64));raise exception 'FAIL UTF16 limit';exception when sqlstate '22023' then null;end;
 perform public.ki_open_wish_submit('ki-general-wishes-fixture',t.private_id,repeat('b',64),'Private Fixture','Private test message',false,repeat('2',64));
 raise notice 'PASS: separate service, private/pending, immutable retry, server cooldown and text limit';
end $$;
reset role;
set local role authenticated;
do $$ declare t record;r jsonb;req uuid:=gen_random_uuid();begin
 select * into t from ki_wish_ctx;perform set_config('request.jwt.claim.sub',t.a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 r:=public.ki_open_wish_workspace(t.sale_id);
 if (r->'stats'->>'total')::integer<>2 or (r->'stats'->>'private')::integer<>1 then raise exception 'FAIL stats/replay duplication';end if;
 if (r->'rows'->0)?|array['receipt_hash','input_hash','receipt','network','token','sequence'] then raise exception 'FAIL owner projection';end if;
 begin perform public.ki_open_wish_manage(t.sale_id,req,'approve',1,t.private_id,'{}');raise exception 'FAIL approval without consent';exception when sqlstate '22023' then null;end;
 r:=public.ki_open_wish_manage(t.sale_id,req,'approve',1,t.wish_id,'{}');
 if r<>public.ki_open_wish_manage(t.sale_id,req,'approve',1,t.wish_id,'{}') then raise exception 'FAIL moderation replay';end if;
 raise notice 'PASS: consent-bound moderation and owner projection';
end $$;
reset role;
set local role service_role;
do $$ declare t record;r jsonb;begin
 select * into t from ki_wish_ctx;r:=public.ki_open_wish_feed('ki-general-wishes-fixture');
 if jsonb_array_length(r->'items')<>1 or r->'items'->0->>'name'<>'Budi Fixture' then raise exception 'FAIL approved list';end if;
 if (r->'items'->0)?|array['receipt','receipt_hash','sale_id','owner_id','consent','people','id_uuid'] then raise exception 'FAIL public data exposure';end if;
 begin perform public.ki_open_wish_withdraw('ki-general-wishes-fixture',t.wish_id,repeat('c',64));raise exception 'FAIL wrong receipt';exception when sqlstate 'P1303' then null;end;
 raise notice 'PASS: limited public projection, wrong receipt denied';
end $$;
reset role;
-- Exercise privacy after every public/RSVP switch is closed and the publication is withdrawn.
update public.ki_open_wish_platform set enabled=false where id=1;
update public.ki_commerce_settings set publishing_enabled=false where id=1;
update public.ki_publications set active=false where sale_id=(select sale_id from ki_wish_ctx);
set local role service_role;
do $$ declare t record;r jsonb;begin
 select * into t from ki_wish_ctx;
 r:=public.ki_open_wish_withdraw('ki-general-wishes-fixture',t.wish_id,t.receipt);
 if r<>public.ki_open_wish_withdraw('ki-general-wishes-fixture',t.wish_id,t.receipt) then raise exception 'FAIL withdrawal replay';end if;
 if t.first_result<>public.ki_open_wish_submit('ki-general-wishes-fixture',t.wish_id,t.receipt,'Budi Fixture','Selamat untuk data uji.',true,repeat('1',64)) then raise exception 'FAIL original ack after removal';end if;
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('a',64),'Fixture','New while closed',true,repeat('3',64));raise exception 'FAIL closed intake';exception when sqlstate 'P1302' then null;end;
 if (public.ki_open_wish_feed('ki-general-wishes-fixture')->>'accepting')::boolean or jsonb_array_length(public.ki_open_wish_feed('ki-general-wishes-fixture')->'items')<>0 then raise exception 'FAIL closed projection';end if;
 raise notice 'PASS: receipt removal with closed service, replay never revives, closure enforced';
end $$;
reset role;
do $$ declare t record;w public.ki_open_wishes;begin
 select * into t from ki_wish_ctx;select * into w from public.ki_open_wishes where id=t.wish_id;
 if not w.removed or w.name<>'' or w.message<>'' or w.consent or w.moderation<>'hidden' then raise exception 'FAIL erasure/no revival';end if;
 if (select count(*) from public.ki_guests)<>(select guests from ki_wish_rsvp_before) or (select count(*) from public.ki_rsvps)<>(select rsvps from ki_wish_rsvp_before) then raise exception 'FAIL touched RSVP';end if;
 if exists(select 1 from public.ki_sales where id=t.sale_id and (total_price<>150000 or status<>'paid')) then raise exception 'FAIL payment altered';end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('ki_open_wishes','ki_open_wish_platform','ki_open_wish_settings','ki_open_wish_actions','ki_open_wish_network') and not c.relrowsecurity) then raise exception 'FAIL RLS';end if;
 raise notice 'PASS: content erased, existing RSVP/payment untouched, new tables RLS';
end $$;
-- Quota check is a deterministic engine test, not a real network/load benchmark.
update public.ki_open_wish_platform set enabled=true where id=1;
update public.ki_commerce_settings set publishing_enabled=true where id=1;
update public.ki_publications set active=true where sale_id=(select sale_id from ki_wish_ctx);
update public.ki_open_wish_network set hits=5,last_at=now()-interval '1 minute' where sale_id=(select sale_id from ki_wish_ctx) and identity_hash=repeat('1',64);
set local role service_role;
do $$ begin
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('a',64),'Fixture','Sixth network post',true,repeat('1',64));raise exception 'FAIL daily quota';exception when sqlstate 'P1304' then null;end;
end $$;
reset role;
insert into public.ki_open_wishes(id,sale_id,name,message,consent,moderation,receipt_hash,input_hash)
select gen_random_uuid(),t.sale_id,'Fixture','Capacity fixture',false,'hidden',repeat('0',64),repeat('1',64) from ki_wish_ctx t cross join generate_series(1,1998);
set local role service_role;
do $$ begin
 begin perform public.ki_open_wish_submit('ki-general-wishes-fixture',gen_random_uuid(),repeat('a',64),'Fixture','Over capacity',true,repeat('3',64));raise exception 'FAIL invitation quota';exception when sqlstate 'P1305' then null;end;
 raise notice 'PASS: daily budget and capacity include removal markers';
end $$;
reset role;
rollback;

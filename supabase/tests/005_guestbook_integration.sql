-- OPTIONAL STAGING TEST. NOT EXECUTED BY THE PACKAGE AUTHOR.
-- Run this ENTIRE file in SQL Editor as postgres after migrations 001–005.
-- Do NOT run on production. It holds locks and custom database triggers can fire.
-- Fixtures below mark an order paid directly solely for isolated testing, NOT a real payment.
-- No Auth emails, transfers, Storage, or external HTTP requests are made by this script.
-- ROLLBACK removes fixture rows; PostgreSQL sequences may still advance.
begin;
do $$ begin
 if public.ki_schema_version()not in (5,6) then raise exception 'Install 001–005 first'; end if;
 if exists(select 1 from auth.users where id::text like 'a5555555-5555-4555-8555-%') then raise exception 'Fixture namespace exists; STOP'; end if;
 if exists(select 1 from public.ki_publications where slug='ki-stage5-only-fixture') then raise exception 'Fixture slug exists; STOP'; end if;
end $$;
create temporary table ki_stage5_ctx(a uuid,b uuid,admin_id uuid,draft_id uuid,sale_id uuid,guest_id uuid,token_value text,req uuid,first_result jsonb) on commit drop;
insert into ki_stage5_ctx values('a5555555-5555-4555-8555-555555555551','a5555555-5555-4555-8555-555555555552','a5555555-5555-4555-8555-555555555553',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),null,gen_random_uuid(),null);
grant select,update on ki_stage5_ctx to authenticated,anon;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'ki-stage5-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
from ki_stage5_ctx cross join lateral unnest(array[a,b,admin_id]) as x(id);
insert into public.ki_admins(user_id) select admin_id from ki_stage5_ctx;
insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id)
select draft_id,a,'elegant-rose',jsonb_build_object('groom','Fixture A','bride','Fixture B','groomParents','','brideParents','','eventDate','2027-01-24','eventTime','08:00','endTime','10:00','timezone','Asia/Jakarta','venue','TEST ONLY','address','Not a real event','mapUrl','','opening','Fixture','story','','photoPaths','[]'::jsonb),1,gen_random_uuid() from ki_stage5_ctx;
insert into public.ki_sales(id,owner_id,invitation_id,theme_slug,theme_name,total_price,active_days,payment_details,customer_name,customer_phone,customer_email,status,paid_at,expires_at)
select sale_id,a,draft_id,'elegant-rose','FIXTURE',150000,14,'{}'::jsonb,'Fixture Only','6281234567890','fixture@example.invalid','paid',now(),now()+interval '14 days' from ki_stage5_ctx;
insert into public.ki_publications(sale_id,owner_id,slug,theme_slug,content,draft_revision)
select t.sale_id,t.a,'ki-stage5-only-fixture','elegant-rose',i.content,1 from ki_stage5_ctx t join public.ki_invitations i on i.id=t.draft_id;
update public.ki_commerce_settings set publishing_enabled=true where id=1;
update public.ki_guest_platform set enabled=true where id=1;
set local role authenticated;
do $$ declare t record; a jsonb; again jsonb; batch jsonb; request_id uuid:=gen_random_uuid();begin
 select * into t from ki_stage5_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin perform count(*) from public.ki_guests;raise exception 'FAIL direct SELECT';exception when insufficient_privilege then null;end;
 batch:=jsonb_build_object('guests',jsonb_build_array(jsonb_build_object('id',t.guest_id,'name','Budi Fixture','max_people',3)));
 a:=public.ki_guest_manage(t.sale_id,'add_many',null,0,request_id,batch);
 again:=public.ki_guest_manage(t.sale_id,'add_many',null,0,request_id,batch);
 if a<>again then raise exception 'FAIL identical owner retry';end if;
 if (public.ki_guest_workspace(t.sale_id)->'stats'->>'registered')::integer<>1 then raise exception 'FAIL duplicate guest';end if;
 begin perform public.ki_guest_manage(t.sale_id,'add_many',null,0,request_id,'{"guests":[]}'::jsonb);raise exception 'FAIL changed retry';exception when sqlstate 'P5006' then null;end;
 perform public.ki_guest_manage(t.sale_id,'settings',null,0,gen_random_uuid(),'{"accepting":true,"show_wishes":true}'::jsonb);
 if (public.ki_guest_workspace(t.sale_id)->'rows'->0) ? 'token' then raise exception 'FAIL list leaks token';end if;
 if (public.ki_guest_export(t.sale_id)->0) ? 'token' then raise exception 'FAIL export leaks token';end if;
 update ki_stage5_ctx set token_value=public.ki_guest_link(t.sale_id,t.guest_id)->>'token';
 raise notice 'PASS: owner private access, batch retry, settings, list/export projections';
end $$;
do $$ declare t record; who uuid;begin
 select * into t from ki_stage5_ctx;
 foreach who in array array[t.b,t.admin_id] loop
  perform set_config('request.jwt.claim.sub',who::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',who,'role','authenticated')::text,true);
  begin perform public.ki_guest_workspace(t.sale_id);raise exception 'FAIL another account sees list';exception when insufficient_privilege then null;end;
  begin perform public.ki_guest_link(t.sale_id,t.guest_id);raise exception 'FAIL another account gets bearer';exception when insufficient_privilege then null;end;
  begin perform public.ki_guest_export(t.sale_id);raise exception 'FAIL another account exports';exception when insufficient_privilege then null;end;
  begin perform public.ki_guest_manage(t.sale_id,'rotate',t.guest_id,1,gen_random_uuid(),'{}'::jsonb);raise exception 'FAIL cross-owner write';exception when insufficient_privilege then null;end;
 end loop;
 raise notice 'PASS: account B and nonowning admin have no guest list/link/write access';
end $$;
reset role;
set local role anon;
do $$ declare t record; a jsonb;again jsonb;begin
 select * into t from ki_stage5_ctx;
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{"role":"anon"}',true);
 begin perform count(*) from public.ki_rsvps;raise exception 'FAIL anonymous table read';exception when insufficient_privilege then null;end;
 if public.ki_guest_context('ki-stage5-only-fixture',repeat('f',64)) is not null then raise exception 'FAIL wrong token';end if;
 if public.ki_guest_context('unrelated-slug',t.token_value) is not null then raise exception 'FAIL cross-slug token';end if;
 begin perform public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,gen_random_uuid(),'yes',4,'','',false);raise exception 'FAIL over capacity';exception when sqlstate '22023' then null;end;
 begin perform public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,gen_random_uuid(),'yes',2,'Bad'||chr(1),'Budi',true);raise exception 'FAIL control-byte bypass';exception when sqlstate '22023' then null;end;
 begin perform public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,gen_random_uuid(),'yes',2,repeat('💐',251),'Budi',true);raise exception 'FAIL Unicode overlength bypass';exception when sqlstate '22023' then null;end;
 a:=public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,t.req,'yes',2,'Selamat fixture!','Budi',true);
 again:=public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,t.req,'yes',2,'Selamat fixture!','Budi',true);
 if a<>again then raise exception 'FAIL guest retry changes response';end if;
 if a->'response'->>'moderation'<>'pending' then raise exception 'FAIL wish automatically approved';end if;
 if jsonb_array_length(public.ki_public_wishes('ki-stage5-only-fixture')->'items')<>0 then raise exception 'FAIL pending wish public';end if;
 begin perform public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,1,gen_random_uuid(),'yes',1,'Changed','Budi',true);raise exception 'FAIL no rate limit';exception when sqlstate 'P5004' then null;end;
 begin perform public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,gen_random_uuid(),'yes',1,'Changed','Budi',true);raise exception 'FAIL stale revision';exception when sqlstate 'P5001' then null;end;
 update ki_stage5_ctx set first_result=a;
 raise notice 'PASS: bearer binding, capacity, pending moderation, same-request replay, rate and version checks';
end $$;
reset role;
set local role authenticated;
do $$ declare t record;begin
 select * into t from ki_stage5_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 perform public.ki_guest_manage(t.sale_id,'moderate',t.guest_id,1,gen_random_uuid(),'{"moderation":"approved"}'::jsonb);
 begin perform public.ki_guest_manage(t.sale_id,'update',t.guest_id,1,gen_random_uuid(),'{"name":"Budi","max_people":1}'::jsonb);raise exception 'FAIL capacity below confirmed';exception when sqlstate 'P5008' then null;end;
 perform public.ki_guest_manage(t.sale_id,'settings',null,1,gen_random_uuid(),'{"accepting":false,"show_wishes":true}'::jsonb);
 raise notice 'PASS: moderation, cannot lower below existing count, close incoming RSVP';
end $$;
reset role;
set local role anon;
do $$ declare t record; item jsonb; r jsonb;begin
 select * into t from ki_stage5_ctx;perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{"role":"anon"}',true);
 item:=public.ki_public_wishes('ki-stage5-only-fixture')->'items'->0;
 if item is null or item->>'name'<>'Budi' then raise exception 'FAIL approved wish missing';end if;
 if item ?| array['guest_id','token','people','attendance','owner_id'] then raise exception 'FAIL public private fields';end if;
 -- Original replay still returns original ack even after host moderation changed current revision.
 r:=public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,0,t.req,'yes',2,'Selamat fixture!','Budi',true);
 if r<>t.first_result then raise exception 'FAIL post-moderation replay';end if;
 -- Consent withdrawal remains possible while accepting=false, with the prior attendance unchanged.
 r:=public.ki_submit_rsvp('ki-stage5-only-fixture',t.token_value,2,gen_random_uuid(),'yes',2,'Selamat fixture!','',false);
 if r->'response'->>'moderation'<>'hidden' or r->'response'->>'people'<>'2' then raise exception 'FAIL privacy withdrawal';end if;
 if jsonb_array_length(public.ki_public_wishes('ki-stage5-only-fixture')->'items')<>0 then raise exception 'FAIL withdrawn wish remains';end if;
 raise notice 'PASS: safe public projection, consent withdrawal during closure, original replay preserved';
end $$;
reset role;
set local role authenticated;
do $$ declare t record; old text;begin
 select * into t from ki_stage5_ctx;perform set_config('request.jwt.claim.sub',t.a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin perform public.ki_guest_manage(t.sale_id,'moderate',t.guest_id,3,gen_random_uuid(),'{"moderation":"approved"}'::jsonb);raise exception 'FAIL approved without consent';exception when sqlstate '22023' then null;end;
 perform public.ki_guest_manage(t.sale_id,'rotate',t.guest_id,1,gen_random_uuid(),'{}'::jsonb);
 if public.ki_guest_context('ki-stage5-only-fixture',t.token_value) is not null then raise exception 'FAIL rotated token still works';end if;
 update ki_stage5_ctx set token_value=public.ki_guest_link(t.sale_id,t.guest_id)->>'token';
 perform public.ki_guest_manage(t.sale_id,'activate',t.guest_id,2,gen_random_uuid(),'{"active":false}'::jsonb);
 if (public.ki_guest_workspace(t.sale_id)->'stats'->>'people')::integer<>0 then raise exception 'FAIL inactive included in headcount';end if;
 if public.ki_guest_context('ki-stage5-only-fixture',(select token_value from ki_stage5_ctx)) is not null then raise exception 'FAIL inactive link works';end if;
 perform public.ki_guest_manage(t.sale_id,'activate',t.guest_id,3,gen_random_uuid(),'{"active":true}'::jsonb);
 raise notice 'PASS: no forced consent, rotation invalidates old link, inactive excluded but history retained';
end $$;
reset role;
update public.ki_guest_platform set enabled=false where id=1;
set local role anon;
do $$ begin
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{"role":"anon"}',true);
 if public.ki_guest_context('ki-stage5-only-fixture',(select token_value from ki_stage5_ctx)) is not null then raise exception 'FAIL global close bypass';end if;
 if public.ki_public_wishes('ki-stage5-only-fixture')->>'enabled'<>'false' then raise exception 'FAIL wishes global close bypass';end if;
end $$;
reset role;
update public.ki_guest_platform set enabled=true where id=1;
update public.ki_sales set expires_at=now()-interval '1 second' where id=(select sale_id from ki_stage5_ctx);
set local role anon;
do $$ begin
 if public.ki_guest_context('ki-stage5-only-fixture',(select token_value from ki_stage5_ctx)) is not null then raise exception 'FAIL expiry bypass';end if;
 raise notice 'PASS: global shutdown and expiry. Script completes with ROLLBACK, not a production verification.';
end $$;
reset role;
rollback;

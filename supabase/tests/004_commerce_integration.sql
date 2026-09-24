-- OPTIONAL, NOT EXECUTED BY PACKAGE AUTHOR.
-- Run the ENTIRE script in SQL Editor as postgres on a DEDICATED STAGING project after 001–004 (also compatible with schema 5).
-- Inserts temporary test accounts and placeholder payment metadata, but no emails/payment calls.
-- Everything is rolled back. Identity sequence numbers may still advance (normal PostgreSQL).
-- Do not use this on production: transaction holds locks and any custom triggers may run.
begin;
do $$ begin
 if public.ki_schema_version() not in (4,5,6) then raise exception 'Install 001–004 first'; end if;
 if exists(select 1 from auth.users where id in ('a4444444-4444-4444-8444-444444444441','a4444444-4444-4444-8444-444444444442','a4444444-4444-4444-8444-444444444443')) then raise exception 'Fixture UUID already exists; STOP'; end if;
end $$;
create temporary table ki_stage4_test_ctx(a uuid,b uuid,admin_id uuid,draft_id uuid,price integer,cfg_rev integer,sale_id uuid,checkout_request uuid,approval_request uuid,paid_result jsonb,expires timestamptz) on commit drop;
insert into ki_stage4_test_ctx(a,b,admin_id,draft_id,price,cfg_rev,checkout_request,approval_request)
select 'a4444444-4444-4444-8444-444444444441','a4444444-4444-4444-8444-444444444442','a4444444-4444-4444-8444-444444444443',gen_random_uuid(),price,1,gen_random_uuid(),gen_random_uuid() from public.ki_templates where slug='elegant-rose' and active=true;
do $$ begin if (select count(*) from ki_stage4_test_ctx)<>1 then raise exception 'Active elegant-rose fixture required'; end if; end $$;
grant select,update on ki_stage4_test_ctx to authenticated;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id, 'ki-stage4-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
from ki_stage4_test_ctx cross join lateral unnest(array[a,b,admin_id]) as x(id);
insert into public.ki_admins(user_id) select admin_id from ki_stage4_test_ctx;
insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id)
select draft_id,a,'elegant-rose',jsonb_build_object('groom','Pemilik Uji','bride','Pasangan Uji','groomParents','','brideParents','','eventDate','2027-01-24','eventTime','08:00','endTime','10:00','timezone','Asia/Jakarta','venue','Tempat Uji','address','Alamat fixture bukan acara nyata','mapUrl','','opening','Undangan pengujian','story','','photoPaths','[]'::jsonb),1,gen_random_uuid() from ki_stage4_test_ctx;
update public.ki_commerce_settings set checkout_enabled=false,publishing_enabled=false,active_days=14,bank_name='BANK FIXTURE - BUKAN PEMBAYARAN',bank_account='0000000000',bank_holder='FIXTURE STAGING',instructions='JANGAN TRANSFER',revision=revision+1 where id=1;
update ki_stage4_test_ctx set cfg_rev=(select revision from public.ki_commerce_settings where id=1);
set local role authenticated;
do $$ declare t record; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin
  perform public.ki_checkout(t.draft_id,1,'elegant-rose',t.price,14,t.cfg_rev,'Pelanggan Uji','6281234567890',t.checkout_request);
  raise exception 'FAIL: checkout disabled but accepted';
 exception when sqlstate 'P4002' then null; end;
 begin update public.ki_sales set status='paid';raise exception 'FAIL: direct client update accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.ki_commerce_settings set checkout_enabled=true,publishing_enabled=true where id=1;
set local role authenticated;
do $$ declare t record; r jsonb; r2 jsonb; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin
  perform public.ki_checkout(t.draft_id,1,'elegant-rose',t.price+1,14,t.cfg_rev,'Pelanggan Uji','6281234567890',t.checkout_request);
  raise exception 'FAIL: stale/tampered quote accepted';
 exception when sqlstate 'P4011' then null; end;
 r:=public.ki_checkout(t.draft_id,1,'elegant-rose',t.price,14,t.cfg_rev,'Pelanggan Uji','6281234567890',t.checkout_request);
 if r->>'status'<>'awaiting_payment' then raise exception 'FAIL: checkout marked paid';end if;
 r2:=public.ki_checkout(t.draft_id,1,'elegant-rose',t.price,14,t.cfg_rev,'Pelanggan Uji','6281234567890',t.checkout_request);
 if r<>r2 then raise exception 'FAIL: exact checkout retry differs';end if;
 update ki_stage4_test_ctx set sale_id=(r->>'id')::uuid;
 r2:=public.ki_checkout(t.draft_id,1,'elegant-rose',t.price,14,t.cfg_rev,'Pelanggan Uji','6281234567890',gen_random_uuid());
 if r<>r2 then raise exception 'FAIL: duplicate checkout created another order';end if;
 begin perform public.ki_publication_action((r->>'id')::uuid,'publish','ki-stage4-test-slug',1,0,gen_random_uuid(),true);raise exception 'FAIL: unpaid publication accepted';exception when sqlstate 'P4003' then null;end;
 begin perform public.ki_sale_action((r->>'id')::uuid,'approve',1,gen_random_uuid(),'','FAKE-REFERENCE',t.price,true);raise exception 'FAIL: owner self-approved';exception when insufficient_privilege then null;end;
 r2:=public.ki_sale_action((r->>'id')::uuid,'submit_payment',1,gen_random_uuid(),'','TRANSFER-TEST',0,false);
 if r2->>'status'<>'awaiting_review' then raise exception 'FAIL: submit payment did not request review';end if;
end $$;
do $$ declare t record; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.b,'role','authenticated')::text,true);
 if exists(select 1 from public.ki_sales where id=t.sale_id) then raise exception 'FAIL: B sees A order';end if;
 if exists(select 1 from public.ki_invitations where id=t.draft_id) then raise exception 'FAIL: B sees A draft';end if;
 begin perform public.ki_sale_action(t.sale_id,'cancel',2,gen_random_uuid(),'','',0,false);raise exception 'FAIL: B modifies A order';exception when insufficient_privilege then null;end;
 begin perform public.ki_publication_action(t.sale_id,'publish','ki-stage4-test-slug',1,0,gen_random_uuid(),true);raise exception 'FAIL: B publishes A';exception when insufficient_privilege then null;end;
end $$;
do $$ declare t record; r jsonb; again jsonb; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.admin_id,'role','authenticated')::text,true);
 begin perform public.ki_sale_action(t.sale_id,'approve',2,t.approval_request,'','BANK-MUTATION-TEST',t.price+1,true);raise exception 'FAIL: wrong received amount accepted';exception when sqlstate 'P4008' then null;end;
 r:=public.ki_sale_action(t.sale_id,'approve',2,t.approval_request,'Teruji di fixture','BANK-MUTATION-TEST',t.price,true);
 again:=public.ki_sale_action(t.sale_id,'approve',2,t.approval_request,'Teruji di fixture','BANK-MUTATION-TEST',t.price,true);
 if r<>again or r->>'status'<>'paid' then raise exception 'FAIL: approval not idempotent';end if;
 update ki_stage4_test_ctx set paid_result=r,expires=(r->>'expires_at')::timestamptz;
 if exists(select 1 from public.ki_publications where sale_id=t.sale_id) then raise exception 'FAIL: approval automatically published';end if;
end $$;
do $$ declare t record; r jsonb; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 begin perform public.ki_publication_action(t.sale_id,'publish','ki-stage4-test-slug',1,0,gen_random_uuid(),false);raise exception 'FAIL: consent bypass';exception when invalid_parameter_value then null;end;
 r:=public.ki_publication_action(t.sale_id,'publish','ki-stage4-test-slug',1,0,gen_random_uuid(),true);
 if r->>'active'<>'true' then raise exception 'FAIL: publication not active';end if;
 begin perform public.ki_delete_draft(t.draft_id,1);raise exception 'FAIL: sales-linked draft deleted';exception when sqlstate 'P0002' then null;end;
end $$;
reset role;
-- Simulate a newly saved version. Published snapshot must remain old until explicit republish.
update public.ki_invitations set content=jsonb_set(content,'{groom}','"Versi Baru Uji"'),revision=2 where id=(select draft_id from ki_stage4_test_ctx);
set local role anon;
do $$ declare r jsonb; begin
 r:=public.ki_public_invitation('ki-stage4-test-slug');
 if r is null or r->'content'->>'groom'<>'Pemilik Uji' then raise exception 'FAIL: draft changes leaked into published snapshot';end if;
 if r ? 'owner_id' or r ? 'customer_email' or r ? 'payment_details' or r->'content'->'photoPaths'<>'[]'::jsonb then raise exception 'FAIL: private projection leak';end if;
 begin perform public.ki_public_photo('ki-stage4-test-slug',0,1);raise exception 'FAIL: anon can fetch private path RPC';exception when insufficient_privilege then null;end;
 begin perform 1 from public.ki_sales;raise exception 'FAIL: anon table select allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
do $$ declare t record; r jsonb; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.a,'role','authenticated')::text,true);
 r:=public.ki_publication_action(t.sale_id,'publish','ki-stage4-test-slug',2,1,gen_random_uuid(),true);
 if public.ki_public_invitation('ki-stage4-test-slug')->'content'->>'groom'<>'Versi Baru Uji' then raise exception 'FAIL: republish did not update';end if;
 if (select expires_at from public.ki_sales where id=t.sale_id)<>t.expires then raise exception 'FAIL: publication extended payment expiry';end if;
 perform public.ki_publication_action(t.sale_id,'unpublish','ki-stage4-test-slug',2,2,gen_random_uuid(),false);
 if public.ki_public_invitation('ki-stage4-test-slug') is not null then raise exception 'FAIL: unpublish visible';end if;
 perform public.ki_publication_action(t.sale_id,'publish','ki-stage4-test-slug',2,3,gen_random_uuid(),true);
end $$;
reset role;
update public.ki_sales set expires_at=now()-interval '1 second' where id=(select sale_id from ki_stage4_test_ctx);
do $$ begin if public.ki_public_invitation('ki-stage4-test-slug') is not null then raise exception 'FAIL: expired public lookup visible';end if;end $$;
update public.ki_sales set expires_at=(select expires from ki_stage4_test_ctx) where id=(select sale_id from ki_stage4_test_ctx);
set local role authenticated;
do $$ declare t record; begin
 select * into t from ki_stage4_test_ctx;
 perform set_config('request.jwt.claim.sub',t.admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t.admin_id,'role','authenticated')::text,true);
 perform public.ki_sale_action(t.sale_id,'revoke',3,gen_random_uuid(),'Pencabutan pengujian','',0,false);
 if public.ki_public_invitation('ki-stage4-test-slug') is not null then raise exception 'FAIL: revoked public lookup visible';end if;
end $$;
reset role;
do $$ begin raise notice 'All assertions reached. Rolling back fixtures now. This is DB testing, not real payment/HTTP/Storage testing.';end $$;
rollback;

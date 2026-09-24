-- OPTIONAL, UNEXECUTED STAGING TEST. Run ENTIRE file as postgres after 001–006.
-- Never production: acquires CMS/catalog locks; custom triggers may fire.
-- Fixture order is NOT a real sale/payment. No money, email, Storage, or HTTP is used.
-- ROLLBACK removes changes; PostgreSQL sequences can still advance.
begin;
do $$ begin
 if public.ki_schema_version()<>6 then raise exception 'Requires schema 6'; end if;
 if exists(select 1 from auth.users where id::text like 'a6666666-6666-4666-8666-%') then raise exception 'Fixture namespace exists; STOP'; end if;
end $$;
create temporary table ki_stage6_ctx(admin_id uuid,buyer uuid,outsider uuid,draft_id uuid,new_id uuid,sale_id uuid,save_request uuid,publish_request uuid,doc jsonb,initial_public jsonb,saved_ack jsonb,published_ack jsonb,state jsonb,price integer) on commit drop;
insert into ki_stage6_ctx(admin_id,buyer,outsider,draft_id,new_id,sale_id,save_request,publish_request)
values('a6666666-6666-4666-8666-666666666661','a6666666-6666-4666-8666-666666666662','a6666666-6666-4666-8666-666666666663',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select,update on ki_stage6_ctx to authenticated,anon;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'ki-stage6-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
from ki_stage6_ctx cross join lateral unnest(array[admin_id,buyer,outsider]) x(id);
insert into public.ki_admins(user_id) select admin_id from ki_stage6_ctx;
insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id)
select draft_id,buyer,'elegant-rose',jsonb_build_object('groom','Fixture A','bride','Fixture B','groomParents','','brideParents','','eventDate','2027-01-24','eventTime','08:00','endTime','10:00','timezone','Asia/Jakarta','venue','TEST ONLY','address','Not a real event','mapUrl','','opening','Fixture','story','','photoPaths','[]'::jsonb),1,gen_random_uuid() from ki_stage6_ctx;
insert into public.ki_sales(id,owner_id,invitation_id,theme_slug,theme_name,total_price,active_days,payment_details,customer_name,customer_phone,customer_email,status)
select sale_id,buyer,draft_id,'elegant-rose','FIXTURE',123456,14,'{}'::jsonb,'Fixture Only','6281234567890','fixture@example.invalid','awaiting_payment' from ki_stage6_ctx;
-- Authoritative server validator, including null/HTML/Unicode rejection.
do $$ declare d jsonb;begin
 select draft into d from public.ki_cms where id=1;
 if public.ki_cms_valid_document(d) is not true then raise exception 'FAIL valid seed';end if;
 if public.ki_cms_valid_document(null) is not false then raise exception 'FAIL null input';end if;
 if public.ki_cms_valid_document(jsonb_set(d,'{content,heroTitle}','"<script>"')) then raise exception 'FAIL HTML accepted';end if;
 if public.ki_cms_valid_document(jsonb_set(d,'{content,heroTitle}',to_jsonb(repeat('💐',81)))) then raise exception 'FAIL UTF16 overlength';end if;
end $$;
set local role anon;
do $$ declare p jsonb;begin
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{"role":"anon"}',true);
 begin perform count(*) from public.ki_cms;raise exception 'FAIL anon reads CMS table';exception when insufficient_privilege then null;end;
 begin perform public.ki_cms_read();raise exception 'FAIL anon reads draft';exception when insufficient_privilege then null;end;
 p:=public.ki_cms_public();if p ? 'draft' or p ? 'history' then raise exception 'FAIL public draft leak';end if;
 update ki_stage6_ctx set initial_public=p;
end $$;
reset role;
set local role authenticated;
do $$ declare t record;begin
 select * into t from ki_stage6_ctx;
 perform set_config('request.jwt.claim.sub',t.outsider::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.outsider,'role','authenticated')::text,true);
 begin perform public.ki_cms_read();raise exception 'FAIL nonadmin CMS';exception when insufficient_privilege then null;end;
 begin perform public.ki_admin_overview();raise exception 'FAIL nonadmin overview';exception when insufficient_privilege then null;end;
 begin perform public.ki_admin_customers('',1);raise exception 'FAIL nonadmin directory';exception when insufficient_privilege then null;end;
 begin perform public.ki_cms_mutate('publish',1,gen_random_uuid(),repeat('a',32),null);raise exception 'FAIL nonadmin publish';exception when insufficient_privilege then null;end;
end $$;
do $$ declare t record; s jsonb; d jsonb; a jsonb; b jsonb; i integer; new_price integer;begin
 select * into t from ki_stage6_ctx;
 perform set_config('request.jwt.claim.sub',t.admin_id::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.admin_id,'role','authenticated')::text,true);
 begin perform count(*) from public.ki_cms_events;raise exception 'FAIL admin raw table access';exception when insufficient_privilege then null;end;
 s:=public.ki_cms_read();d:=jsonb_set(s->'live','{content,heroEyebrow}','"CMS FIXTURE ONLY"');
 for i in 0..7 loop
  if d->'catalog'->i->>'slug'='elegant-rose' then d:=jsonb_set(d,array['catalog',i::text,'active'],'false');end if;
  if d->'catalog'->i->>'slug'='modern-minimalist' then
   new_price:=case when (d->'catalog'->i->>'price')::integer<99999000 then (d->'catalog'->i->>'price')::integer+1000 else 99899000 end;
   d:=jsonb_set(d,array['catalog',i::text,'price'],to_jsonb(new_price));d:=jsonb_set(d,array['catalog',i::text,'active'],'true');
  end if;
 end loop;
 a:=public.ki_cms_mutate('save',(s->>'revision')::integer,t.save_request,s->>'catalog_hash',d);
 b:=public.ki_cms_mutate('save',(s->>'revision')::integer,t.save_request,s->>'catalog_hash',d);
 if a<>b then raise exception 'FAIL duplicate save';end if;
 if public.ki_cms_public()<>t.initial_public then raise exception 'FAIL saving exposes draft';end if;
 begin perform public.ki_cms_mutate('save',(s->>'revision')::integer,t.save_request,repeat('f',32),d);raise exception 'FAIL changed retry';exception when sqlstate 'P6002' then null;end;
 begin perform public.ki_cms_mutate('save',(s->>'revision')::integer,gen_random_uuid(),s->>'catalog_hash',d);raise exception 'FAIL stale revision';exception when sqlstate 'P6001' then null;end;
 update ki_stage6_ctx set doc=d,saved_ack=a,state=public.ki_cms_read(),price=new_price;
end $$;
do $$ declare t record; a jsonb; b jsonb;p jsonb;begin
 select * into t from ki_stage6_ctx;
 a:=public.ki_cms_mutate('publish',(t.state->>'revision')::integer,t.publish_request,t.state->>'catalog_hash',null);
 b:=public.ki_cms_mutate('publish',(t.state->>'revision')::integer,t.publish_request,t.state->>'catalog_hash',null);
 if a<>b then raise exception 'FAIL duplicate publish';end if;
 p:=public.ki_cms_public();
 if p->'content'->>'heroEyebrow'<>'CMS FIXTURE ONLY' then raise exception 'FAIL content not published';end if;
 if exists(select 1 from jsonb_array_elements(p->'catalog') x where x->>'slug'='elegant-rose') then raise exception 'FAIL inactive theme still public';end if;
 if not exists(select 1 from jsonb_array_elements(p->'catalog') x where x->>'slug'='modern-minimalist' and (x->>'price')::integer=t.price) then raise exception 'FAIL catalog price not synchronized';end if;
 if (select total_price from public.ki_sales where id=t.sale_id)<>123456 then raise exception 'FAIL old price changed';end if;
 perform public.ki_admin_overview();perform public.ki_admin_customers('Fixture',1);
 update ki_stage6_ctx set published_ack=a,state=public.ki_cms_read();
 raise notice 'PASS: admin-only, save/publish separation, replay, conflicts, catalog, old quote snapshot';
end $$;
-- Existing owner's retired draft is editable; new retired selection is rejected.
do $$ declare t record; d jsonb; ack jsonb;begin
 select * into t from ki_stage6_ctx;
 perform set_config('request.jwt.claim.sub',t.buyer::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.buyer,'role','authenticated')::text,true);
 select content into d from public.ki_invitations where id=t.draft_id;
 ack:=public.ki_save_draft(t.draft_id,'elegant-rose',d,1,gen_random_uuid());
 if ack->>'revision'<>'2' then raise exception 'FAIL existing retired draft not saved';end if;
 begin perform public.ki_save_draft(t.new_id,'elegant-rose',d,0,gen_random_uuid());raise exception 'FAIL new retired draft';exception when invalid_parameter_value then null;end;
 if not exists(select 1 from jsonb_array_elements(public.ki_editor_catalog(t.draft_id)) x where x->>'slug'='elegant-rose') then raise exception 'FAIL owned retired option';end if;
end $$;
reset role;
-- Simulate an operator editing catalog outside the CMS after an admin loaded its state.
update public.ki_templates set price=price+1 where slug='modern-minimalist';
set local role authenticated;
do $$ declare t record;begin
 select * into t from ki_stage6_ctx;
 perform set_config('request.jwt.claim.sub',t.admin_id::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',t.admin_id,'role','authenticated')::text,true);
 begin perform public.ki_cms_mutate('save',(t.state->>'revision')::integer,gen_random_uuid(),t.state->>'catalog_hash',t.doc);raise exception 'FAIL out-of-band price overwrite';exception when sqlstate 'P6003' then null;end;
 raise notice 'PASS: retired-theme continuity and out-of-band catalog protection';
end $$;
reset role;
rollback;

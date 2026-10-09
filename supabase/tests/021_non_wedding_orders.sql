-- Isolated test database only. Synthetic accounts/orders; no payment or email calls.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' then raise exception 'Isolated database required'; end if;
end $$;
create temporary table category_test_context(a uuid,b uuid,admin_id uuid,settings_revision integer,days integer,body jsonb) on commit drop;
insert into category_test_context select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),revision,active_days,
 '{"groom":"Acara Contoh","bride":"","groomParents":"Keluarga Contoh","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Gedung Contoh","address":"Alamat sintetis","mapUrl":"","opening":"Selamat datang","story":"Tentang acara","photoPaths":[],"music":"moonlight"}'::jsonb
 from public.ki_commerce_settings where id=1;
create temporary table category_test_results(slug text,id uuid,sale uuid) on commit drop;
grant select on category_test_context to authenticated;
grant select,insert on category_test_results to authenticated;
grant select on category_test_results to anon,service_role;
insert into auth.users(id,email,aud,role,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
 select id,'category-test-'||id::text||'@example.invalid','authenticated','authenticated',now(),'{}','{}',now(),now()
 from category_test_context cross join lateral unnest(array[a,b,admin_id]) x(id);
insert into public.ki_admins(user_id) select admin_id from category_test_context;
update public.ki_commerce_settings set checkout_enabled=true,publishing_enabled=true,bank_name='FIXTURE',bank_account='0000000000',bank_holder='DO NOT TRANSFER' where id=1;
update public.ki_settings set accept_order_requests=true where id=1;
update public.ki_templates set active=true where category<>'pernikahan';
do $$ declare c record; begin
 select * into c from category_test_context;
 if public.ki_publishable_theme_content(c.body,c.a,'elegant-rose') then raise exception 'Wedding requires both names';end if;
 if public.ki_valid_theme_content(c.body||'{"bride":"hidden"}',c.a,'sweet-birthday') then raise exception 'Hidden spouse accepted';end if;
 if public.ki_publishable_theme_content(c.body||'{"gifts":[{"bank":"","account":"","holder":""}]}',c.a,'sweet-birthday') then raise exception 'Incomplete gift accepted';end if;
 if public.ki_publishable_theme_content(c.body||'{"address":""}',c.a,'sweet-birthday') then raise exception 'Incomplete venue accepted';end if;
 if has_function_privilege('anon','public.ki_valid_theme_content(jsonb,uuid,text)','execute') or has_function_privilege('authenticated','public.ki_publishable_theme_content(jsonb,uuid,text)','execute') then raise exception 'Private helper exposed';end if;
end $$;
set local role authenticated;
do $$ declare c record; t record; d uuid; r jsonb; again jsonb; req uuid; pubreq uuid; sale uuid; n integer:=0; partial uuid:=gen_random_uuid(); begin
 select * into c from category_test_context;
 perform set_config('request.jwt.claim.sub',c.a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c.a,'role','authenticated')::text,true);
 for t in select slug,category,price from public.ki_templates where category<>'pernikahan' order by slug loop
  n:=n+1;d:=gen_random_uuid();req:=gen_random_uuid();pubreq:=gen_random_uuid();
  if not exists(select 1 from jsonb_array_elements(public.ki_editor_catalog(null)) e where e->>'slug'=t.slug) then raise exception 'Editor missing %',t.slug;end if;
  r:=public.ki_save_draft(d,t.slug,c.body,0,req);
  if public.ki_save_draft(d,t.slug,c.body,0,req)<>r then raise exception 'Save retry failed';end if;
  begin perform public.ki_save_draft(d,'elegant-rose',c.body||'{"bride":"Other"}',1,gen_random_uuid());raise exception 'Cross-category update accepted';exception when invalid_parameter_value then null;end;
  begin perform public.ki_checkout(d,1,t.slug,t.price+1,c.days,c.settings_revision,'Client Test','6281234567890',req);raise exception 'Price tampering accepted';exception when sqlstate 'P4011' then null;end;
  r:=public.ki_checkout(d,1,t.slug,t.price,c.days,c.settings_revision,'Client Test','6281234567890',req);
  sale:=(r->>'id')::uuid;
  if r->>'status'<>'awaiting_payment' then raise exception 'Checkout auto-paid';end if;
  again:=public.ki_checkout(d,1,t.slug,t.price,c.days,c.settings_revision,'Client Test','6281234567890',req);
  if again<>r then raise exception 'Checkout retry failed';end if;
  again:=public.ki_checkout(d,1,t.slug,t.price,c.days,c.settings_revision,'Client Test','6281234567890',gen_random_uuid());
  if again<>r then raise exception 'Duplicate charge';end if;
  begin perform public.ki_publication_action(sale,'publish','fixture-'||t.slug,1,0,pubreq,true);raise exception 'Unpaid publication allowed';exception when sqlstate 'P4003' then null;end;
  begin perform public.ki_sale_action(sale,'approve',1,gen_random_uuid(),'','FAKE',t.price,true);raise exception 'Self approval allowed';exception when insufficient_privilege then null;end;
  perform public.ki_sale_action(sale,'submit_payment',1,gen_random_uuid(),'','SYNTHETIC',0,false);
  perform set_config('request.jwt.claim.sub',c.b::text,true);
  begin perform public.ki_checkout(d,1,t.slug,t.price,c.days,c.settings_revision,'Other Test','6281234567890',gen_random_uuid());raise exception 'Other owner checked out';exception when insufficient_privilege then null;end;
  begin perform public.ki_publication_action(sale,'publish','fixture-'||t.slug,1,0,pubreq,true);raise exception 'Other owner published';exception when insufficient_privilege then null;end;
  if exists(select 1 from public.ki_invitations where id=d) then raise exception 'Private draft leaked';end if;
  perform set_config('request.jwt.claim.sub',c.admin_id::text,true);
  perform public.ki_sale_action(sale,'approve',2,gen_random_uuid(),'Fixture only','SYNTHETIC',t.price,true);
  perform set_config('request.jwt.claim.sub',c.a::text,true);
  if exists(select 1 from public.ki_publications where sale_id=sale) then raise exception 'Approval auto-published';end if;
  begin perform public.ki_publication_action(sale,'publish','fixture-'||t.slug,1,0,pubreq,false);raise exception 'Consent not enforced';exception when invalid_parameter_value then null;end;
  r:=public.ki_publication_action(sale,'publish','fixture-'||t.slug,1,0,pubreq,true);
  if public.ki_publication_action(sale,'publish','fixture-'||t.slug,1,0,pubreq,true)<>r then raise exception 'Publish retry failed';end if;
  if (select content->>'groom' from public.ki_publications where sale_id=sale)<>'Acara Contoh' then raise exception 'Wrong public primary name';end if;
  perform public.ki_request_order(d,'Client Test','6281234567890');
  insert into category_test_results values(t.slug,d,sale);
 end loop;
 if n<>9 then raise exception 'Expected all nine non-wedding themes, got %',n;end if;
 perform public.ki_save_draft(partial,'sweet-birthday',c.body||'{"groom":""}',0,gen_random_uuid());
 begin perform public.ki_checkout(partial,1,'sweet-birthday',(select price from public.ki_templates where slug='sweet-birthday'),c.days,c.settings_revision,'Client Test','6281234567890',gen_random_uuid());raise exception 'Incomplete primary name accepted';exception when sqlstate 'P4005' then null;end;
 -- Both themes in the same category may be exchanged before purchase.
 perform public.ki_save_draft(partial,'peach-confetti',c.body,1,gen_random_uuid());
end $$;
reset role;
update public.ki_templates set active=false where slug='sweet-birthday';
set local role authenticated;
do $$ declare c record; d uuid; r jsonb; begin
 select * into c from category_test_context;
 select id into d from category_test_results where slug='sweet-birthday';
 perform set_config('request.jwt.claim.sub',c.a::text,true);
 perform public.ki_save_draft(d,'sweet-birthday',c.body||'{"story":"Still editable"}',1,gen_random_uuid());
 if not exists(select 1 from jsonb_array_elements(public.ki_editor_catalog(d)) e where e->>'slug'='sweet-birthday') then raise exception 'Retired owned theme not editable';end if;
 begin perform public.ki_save_draft(gen_random_uuid(),'sweet-birthday',c.body,0,gen_random_uuid());raise exception 'Retired theme available for new drafts';exception when invalid_parameter_value then null;end;
 perform set_config('request.jwt.claim.sub',c.b::text,true);
 if exists(select 1 from jsonb_array_elements(public.ki_editor_catalog(d)) e where e->>'slug'='sweet-birthday') then raise exception 'Other owner sees retired theme';end if;
end $$;
reset role;
set local role service_role;
do $$ declare t record; r jsonb; begin
 for t in select * from category_test_results loop
  r:=public.ki_public_invitation('fixture-'||t.slug);
  if r is null or r->>'theme_slug'<>t.slug or r->'content'->>'bride'<>'' or r->'content'->>'groomParents'<>'Keluarga Contoh' then raise exception 'Non-wedding snapshot failed';end if;
  if r ? 'owner_id' or r ? 'customer_email' or r ? 'payment_details' or r->'content'->'photoPaths'<>'[]'::jsonb then raise exception 'Private projection leak';end if;
 end loop;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.ki_editor_catalog(null);raise exception 'Anon editor accepted';exception when insufficient_privilege then null;end;
 begin perform public.ki_public_invitation('fixture-sweet-birthday');raise exception 'Public gateway bypass accepted';exception when insufficient_privilege then null;end;
 begin perform 1 from public.ki_sales;raise exception 'Anon order access accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;

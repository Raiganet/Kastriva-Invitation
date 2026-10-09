-- Enable ordering for all four invitation categories. No customer data, prices, CMS or flags are modified.

-- Category-aware validation keeps the existing content format and all media/event limits.
-- New helpers are private INVOKER functions; existing authenticated RPCs own the writes.
create or replace function public.ki_valid_theme_content(c jsonb,u uuid,p_theme text) returns boolean
language plpgsql stable security invoker set search_path='' as $$
declare cat text;
begin
 if not public.ki_valid_content(c,u) then return false; end if;
 select category into cat from public.ki_templates where slug=p_theme;
 if cat is null or cat not in ('pernikahan','ulang-tahun','aqiqah','acara-kantor') then return false; end if;
 -- For non-wedding events groom is the primary name, groomParents is the optional host.
 if cat<>'pernikahan' and (trim(c->>'bride')<>'' or trim(c->>'brideParents')<>'') then return false; end if;
 return true;
end $$;
revoke all on function public.ki_valid_theme_content(jsonb,uuid,text) from public,anon,authenticated;

create or replace function public.ki_publishable_theme_content(c jsonb,u uuid,p_theme text) returns boolean
language plpgsql stable security invoker set search_path='' as $$
declare cat text; e jsonb; gift jsonb;
begin
 if not public.ki_valid_theme_content(c,u,p_theme) or trim(c->>'groom')='' then return false; end if;
 select category into cat from public.ki_templates where slug=p_theme;
 if cat='pernikahan' and trim(c->>'bride')='' then return false; end if;
 if c ? 'events' then
  for e in select value from jsonb_array_elements(c->'events') loop
   if trim(e->>'eventDate')='' or trim(e->>'label')='' or trim(e->>'venue')='' or trim(e->>'address')='' then return false; end if;
  end loop;
 else
  if trim(c->>'eventDate')='' or trim(c->>'venue')='' or trim(c->>'address')='' then return false; end if;
 end if;
 for gift in select value from jsonb_array_elements(coalesce(c->'gifts','[]'::jsonb)) loop
  if trim(gift->>'bank')='' or trim(gift->>'holder')='' or (gift->>'account') !~ '^[0-9]{5,30}$' then return false; end if;
 end loop;
 return true;
end $$;
revoke all on function public.ki_publishable_theme_content(jsonb,uuid,text) from public,anon,authenticated;

create or replace function public.ki_save_draft(p_id uuid,p_theme text,p_content jsonb,p_expected_revision integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations; count_drafts integer;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed email required' using errcode='42501'; end if;
 if p_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0 or not public.ki_valid_theme_content(p_content,actor,p_theme) then raise exception 'Invalid draft' using errcode='22023'; end if;
 if not exists(select 1 from public.ki_templates where slug=p_theme and category in ('pernikahan','ulang-tahun','aqiqah','acara-kantor') and (active=true or exists(select 1 from public.ki_invitations own where own.id=p_id and own.owner_id=actor and own.theme_slug=p_theme))) then raise exception 'Invalid theme' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_content->'photoPaths') as p(path) where not exists(select 1 from storage.objects o where o.bucket_id='ki-media' and o.name=p.path)) then raise exception 'Photo unavailable' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from public.ki_deleted_drafts where id=p_id) then raise exception 'Draft was deleted' using errcode='40001'; end if;
 select * into row_data from public.ki_invitations where id=p_id and owner_id=actor for update;
 if found then
  if row_data.last_request_id=p_request_id then
   if row_data.content<>p_content or row_data.theme_slug<>p_theme then raise exception 'Retry payload differs' using errcode='22023'; end if;
   return jsonb_build_object('id',row_data.id,'revision',row_data.revision,'updated_at',row_data.updated_at);
  end if;
  if row_data.revision<>p_expected_revision then raise exception 'Version conflict' using errcode='40001'; end if;
  if (select category from public.ki_templates where slug=row_data.theme_slug) is distinct from (select category from public.ki_templates where slug=p_theme) then raise exception 'Create a new draft for a different category' using errcode='22023'; end if;
  update public.ki_invitations set theme_slug=p_theme,content=p_content,revision=revision+1,last_request_id=p_request_id,updated_at=now() where id=p_id and owner_id=actor returning * into row_data;
 else
  if p_expected_revision<>0 then raise exception 'Version conflict' using errcode='40001'; end if;
  if exists(select 1 from public.ki_invitations where id=p_id) then raise exception 'Access denied' using errcode='42501'; end if;
  select count(*) into count_drafts from public.ki_invitations where owner_id=actor;
  if count_drafts>=20 then raise exception 'Draft limit reached' using errcode='P0001'; end if;
  insert into public.ki_invitations(id,owner_id,theme_slug,content,revision,last_request_id) values(p_id,actor,p_theme,p_content,1,p_request_id) returning * into row_data;
 end if;
 return jsonb_build_object('id',row_data.id,'revision',row_data.revision,'updated_at',row_data.updated_at);
end $$;
revoke all on function public.ki_save_draft(uuid,text,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.ki_save_draft(uuid,text,jsonb,integer,uuid) to authenticated;

create or replace function public.ki_editor_catalog(p_invitation uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed user required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('slug',t.slug,'name',t.name,'description',t.description,'price',t.price,'active',t.active) order by t.sort_order,t.slug)
 from public.ki_templates t where t.category in ('pernikahan','ulang-tahun','aqiqah','acara-kantor') and (t.active or exists(select 1 from public.ki_invitations d where d.id=p_invitation and d.owner_id=auth.uid() and d.theme_slug=t.slug))),'[]'::jsonb);
end $$;
revoke all on function public.ki_editor_catalog(uuid) from public,anon,authenticated;
grant execute on function public.ki_editor_catalog(uuid) to authenticated;

create or replace function public.ki_checkout(p_invitation uuid,p_draft_revision integer,p_theme text,p_quoted_price integer,p_quoted_days integer,p_settings_revision integer,p_name text,p_phone text,p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); d public.ki_invitations; s public.ki_sales; cfg public.ki_commerce_settings;
 t public.ki_templates; prior public.ki_sale_events; payload jsonb; result jsonb; email_value text;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed user required' using errcode='42501'; end if;
 if p_invitation is null or p_request is null or p_draft_revision is null or p_draft_revision<1 or p_settings_revision is null
  or p_theme is null or p_quoted_price is null or p_quoted_days is null
  or p_name is null or char_length(trim(p_name)) not between 2 and 100 or p_phone is null or p_phone !~ '^62[0-9]{8,13}$' then raise exception 'Invalid checkout' using errcode='22023'; end if;
 payload:=jsonb_build_object('invitation',p_invitation,'revision',p_draft_revision,'theme',p_theme,'price',p_quoted_price,'days',p_quoted_days,'settings_revision',p_settings_revision,'name',trim(p_name),'phone',p_phone);
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into prior from public.ki_sale_events where actor_id=actor and request_id=p_request;
 if found then
  if prior.action<>'checkout' or prior.request_payload<>payload then raise exception 'Retry differs' using errcode='P4010'; end if;
  return prior.result;
 end if;
 select * into d from public.ki_invitations where id=p_invitation and owner_id=actor for update;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 select * into s from public.ki_sales where invitation_id=p_invitation;
 if found then return public.ki_sale_result(s); end if; -- one order/draft, no duplicate charge after a lost response
 select * into cfg from public.ki_commerce_settings where id=1 for share;
 if cfg.checkout_enabled is distinct from true then raise exception 'Checkout disabled' using errcode='P4002'; end if;
 if trim(cfg.bank_name)='' or trim(cfg.bank_holder)='' or cfg.bank_account !~ '^[0-9][0-9 -]{3,48}[0-9]$' then raise exception 'Payment details missing' using errcode='P4002'; end if;
 if d.revision<>p_draft_revision then raise exception 'Draft changed' using errcode='P4001'; end if;
 if not public.ki_publishable_theme_content(d.content,actor,d.theme_slug) then raise exception 'Complete event' using errcode='P4005'; end if;
 select * into t from public.ki_templates where slug=d.theme_slug and active=true and category in ('pernikahan','ulang-tahun','aqiqah','acara-kantor') for share;
 if not found or t.price<=0 then raise exception 'Theme unavailable' using errcode='P4006'; end if;
 if p_theme<>t.slug or p_quoted_price<>t.price or p_quoted_days<>cfg.active_days or p_settings_revision<>cfg.revision then raise exception 'Quote changed' using errcode='P4011'; end if;
 select email into email_value from auth.users where id=actor;
 insert into public.ki_sales(owner_id,invitation_id,theme_slug,theme_name,total_price,active_days,payment_details,customer_name,customer_phone,customer_email)
 values(actor,d.id,t.slug,t.name,t.price,cfg.active_days,jsonb_build_object('bank_name',cfg.bank_name,'bank_account',cfg.bank_account,'bank_holder',cfg.bank_holder,'instructions',cfg.instructions),trim(p_name),p_phone,email_value) returning * into s;
 result:=public.ki_sale_result(s);
 insert into public.ki_sale_events(sale_id,actor_id,request_id,action,old_status,new_status,request_payload,result)
 values(s.id,actor,p_request,'checkout','',s.status,payload,result);
 return result;
end $$;
revoke all on function public.ki_checkout(uuid,integer,text,integer,integer,integer,text,text,uuid) from public,anon,authenticated;
grant execute on function public.ki_checkout(uuid,integer,text,integer,integer,integer,text,text,uuid) to authenticated;

create or replace function public.ki_publication_action(p_sale uuid,p_action text,p_slug text,p_draft_revision integer,p_publication_revision integer,p_request uuid,p_consent boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s public.ki_sales; d public.ki_invitations; pub public.ki_publications;
 prior public.ki_sale_events; payload jsonb; result jsonb; previous_rev integer;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed user required' using errcode='42501'; end if;
 if p_sale is null or p_request is null or p_draft_revision is null or p_draft_revision<1 or p_publication_revision is null or p_publication_revision<0
  or p_action is null or p_action not in ('publish','unpublish') or p_consent is null or p_slug is null or char_length(p_slug) not between 5 and 64
  or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or p_slug in ('admin','api','auth','dashboard','demo','login','setup','tema','harga','kastriva','undangan','null','undefined') then raise exception 'Invalid publication' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into s from public.ki_sales where id=p_sale and owner_id=actor;
 if not found then raise exception 'Owner required' using errcode='42501'; end if;
 -- Same order of locks as checkout: owner -> draft -> sale -> publication.
 select * into d from public.ki_invitations where id=s.invitation_id and owner_id=actor for update;
 if not found then raise exception 'Draft missing' using errcode='42501'; end if;
 select * into s from public.ki_sales where id=p_sale and owner_id=actor for update;
 payload:=jsonb_build_object('sale',p_sale,'action',p_action,'slug',p_slug,'draft_revision',p_draft_revision,'publication_revision',p_publication_revision,'consent',p_consent);
 select * into prior from public.ki_sale_events where actor_id=actor and request_id=p_request;
 if found then
  if prior.action<>p_action or prior.request_payload<>payload then raise exception 'Retry differs' using errcode='P4010'; end if;
  return prior.result;
 end if;
 if p_action<>'unpublish' and (select count(*) from public.ki_sale_events where sale_id=p_sale)>=200 then raise exception 'Audit limit; contact operator' using errcode='P0001'; end if;
 select * into pub from public.ki_publications where sale_id=p_sale for update;
 previous_rev:=coalesce(pub.revision,0);
 if previous_rev<>p_publication_revision then raise exception 'Publication changed' using errcode='P4001'; end if;
 if previous_rev>0 and pub.slug<>p_slug then raise exception 'Published address is immutable' using errcode='P4004'; end if;
 if p_action='unpublish' then
  if previous_rev=0 or pub.active=false then raise exception 'No active publication' using errcode='P4009'; end if;
  update public.ki_publications set active=false,revision=revision+1,updated_at=now() where sale_id=p_sale returning * into pub;
 else
  if not p_consent then raise exception 'Public consent required' using errcode='22023'; end if;
  if not exists(select 1 from public.ki_commerce_settings where id=1 and publishing_enabled=true) then raise exception 'Publishing disabled' using errcode='P4002'; end if;
  if s.status<>'paid' or s.expires_at is null or s.expires_at<=now() then raise exception 'Verified payment and valid period required' using errcode='P4003'; end if;
  if d.revision<>p_draft_revision then raise exception 'Draft changed' using errcode='P4001'; end if;
  if d.theme_slug<>s.theme_slug then raise exception 'Use the purchased theme' using errcode='P4006'; end if;
  if not public.ki_publishable_theme_content(d.content,actor,d.theme_slug) then raise exception 'Complete event' using errcode='P4005'; end if;
  if exists(select 1 from jsonb_array_elements_text(d.content->'photoPaths') as p(path) where not exists(select 1 from storage.objects o where o.bucket_id='ki-media' and o.name=p.path)) then raise exception 'Photo unavailable' using errcode='P4007'; end if;
  if exists(select 1 from public.ki_publications where slug=p_slug and sale_id<>p_sale) then raise exception 'Address in use' using errcode='P4004'; end if;
  if previous_rev=0 then
   begin
    insert into public.ki_publications(sale_id,owner_id,slug,theme_slug,content,draft_revision)
    values(p_sale,actor,p_slug,d.theme_slug,d.content,d.revision) returning * into pub;
   exception when unique_violation then raise exception 'Address in use' using errcode='P4004'; end;
  else
   update public.ki_publications set content=d.content,theme_slug=d.theme_slug,draft_revision=d.revision,revision=revision+1,active=true,updated_at=now() where sale_id=p_sale returning * into pub;
  end if;
 end if;
 result:=jsonb_build_object('sale_id',p_sale,'slug',pub.slug,'revision',pub.revision,'active',pub.active,'draft_revision',pub.draft_revision);
 insert into public.ki_sale_events(sale_id,actor_id,request_id,action,old_status,new_status,note,request_payload,result)
 values(p_sale,actor,p_request,p_action,s.status,s.status,case when p_action='publish' then 'Versi draft '||d.revision||' diterbitkan dengan persetujuan pemilik.' else 'Undangan ditarik dari publik.' end,payload,result);
 return result;
end $$;
revoke all on function public.ki_publication_action(uuid,text,text,integer,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.ki_publication_action(uuid,text,text,integer,integer,uuid,boolean) to authenticated;

create or replace function public.ki_request_order(p_invitation uuid,p_name text,p_phone text) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); draft public.ki_invitations; result public.ki_orders; email_value text; template_price integer;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 -- The database flag is authoritative even for direct RPC calls bypassing Next.js.
 if not exists(select 1 from public.ki_settings where id=1 and accept_order_requests=true) then raise exception 'Order requests disabled' using errcode='42501'; end if;
 if p_invitation is null or p_name is null or char_length(trim(p_name)) not between 2 and 100 or p_phone is null or p_phone !~ '^62[0-9]{8,13}$' then raise exception 'Invalid contact' using errcode='22023'; end if;
 select email into email_value from auth.users where id=actor and email_confirmed_at is not null;
 if email_value is null then raise exception 'Confirm email first' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into draft from public.ki_invitations where id=p_invitation and owner_id=actor for update;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 select * into result from public.ki_orders where invitation_id=p_invitation and owner_id=actor;
 if found then
  if result.customer_name<>trim(p_name) or result.customer_phone<>p_phone then raise exception 'Request already exists with different contact' using errcode='22023'; end if;
  return jsonb_build_object('id',result.id,'order_code',result.order_code,'status',result.status,'total_price',result.total_price);
 end if;
 if trim(draft.content->>'groom')='' or ((select category from public.ki_templates where slug=draft.theme_slug)='pernikahan' and trim(draft.content->>'bride')='') or not public.ki_valid_theme_content(draft.content,actor,draft.theme_slug) or (draft.content->>'eventDate')='' or trim(draft.content->>'venue')='' then raise exception 'Complete event first' using errcode='22023'; end if;
 select price into template_price from public.ki_templates where slug=draft.theme_slug and active=true and category in ('pernikahan','ulang-tahun','aqiqah','acara-kantor');
 if template_price is null then raise exception 'Theme unavailable' using errcode='22023'; end if;
 insert into public.ki_orders(owner_id,invitation_id,theme_slug,customer_email,customer_name,customer_phone,total_price,snapshot)
 values(actor,p_invitation,draft.theme_slug,email_value,trim(p_name),p_phone,template_price,draft.content) returning * into result;
 return jsonb_build_object('id',result.id,'order_code',result.order_code,'status',result.status,'total_price',result.total_price);
end $$;
revoke all on function public.ki_request_order(uuid,text,text) from public,anon,authenticated;
grant execute on function public.ki_request_order(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';

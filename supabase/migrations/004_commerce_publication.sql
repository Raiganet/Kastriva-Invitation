-- Kastriva Invitation 1.4.0 — additive commerce, NOT a conversion of legacy requests.
-- Run after 003 on the SAME Invitation project. Back up before applying.
begin;
do $$ begin
 if to_regprocedure('public.ki_schema_version()') is null then raise exception 'Install 001–003 first'; end if;
 if public.ki_schema_version() not in (3,4) then raise exception '004 requires schema 3 or 4; do not downgrade'; end if;
end $$;

create table if not exists public.ki_commerce_settings (
 id integer primary key check(id=1), revision integer not null default 1 check(revision>0),
 checkout_enabled boolean not null default false, publishing_enabled boolean not null default false,
 active_days integer not null default 365 check(active_days between 1 and 730),
 bank_name text not null default '' check(char_length(bank_name)<=80),
 bank_account text not null default '' check(char_length(bank_account)<=50),
 bank_holder text not null default '' check(char_length(bank_holder)<=120),
 instructions text not null default '' check(char_length(instructions)<=1500),
 updated_at timestamptz not null default now()
);
insert into public.ki_commerce_settings(id) values(1) on conflict(id) do nothing;
create table if not exists public.ki_sales (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete restrict,
 invitation_id uuid not null unique references public.ki_invitations(id) on delete restrict,
 order_code text not null unique default ('KIP-'||upper(replace(gen_random_uuid()::text,'-',''))),
 theme_slug text not null references public.ki_templates(slug), theme_name text not null,
 total_price integer not null check(total_price>0), active_days integer not null check(active_days between 1 and 730),
 payment_details jsonb not null check(jsonb_typeof(payment_details)='object'),
 customer_name text not null, customer_phone text not null, customer_email text not null,
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','awaiting_review','rejected','paid','cancelled','revoked')),
 revision integer not null default 1 check(revision>0),
 payment_reference text not null default '', admin_note text not null default '',
 paid_at timestamptz, expires_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((paid_at is null)=(expires_at is null)),
 check(status not in ('paid','revoked') or paid_at is not null)
);
create index if not exists ki_sales_owner_created on public.ki_sales(owner_id,created_at desc);
create index if not exists ki_sales_state_created on public.ki_sales(status,created_at desc);
create table if not exists public.ki_publications (
 sale_id uuid primary key references public.ki_sales(id) on delete restrict,
 owner_id uuid not null references auth.users(id) on delete restrict,
 slug text not null unique check(char_length(slug) between 5 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 theme_slug text not null references public.ki_templates(slug), content jsonb not null,
 draft_revision integer not null check(draft_revision>0), revision integer not null default 1 check(revision>0),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(jsonb_typeof(content)='object' and octet_length(content::text)<=32768)
);
create table if not exists public.ki_sale_events (
 id bigint generated always as identity primary key,
 sale_id uuid not null references public.ki_sales(id) on delete restrict,
 actor_id uuid not null, request_id uuid not null, action text not null,
 old_status text not null, new_status text not null, note text not null default '',
 request_payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
 unique(actor_id,request_id)
);
create index if not exists ki_sale_events_sale_created on public.ki_sale_events(sale_id,created_at desc);
alter table public.ki_commerce_settings enable row level security;
alter table public.ki_sales enable row level security;
alter table public.ki_publications enable row level security;
alter table public.ki_sale_events enable row level security;
revoke all on public.ki_commerce_settings,public.ki_sales,public.ki_publications,public.ki_sale_events from public,anon,authenticated;
revoke all on sequence public.ki_sale_events_id_seq from public,anon,authenticated;
grant select on public.ki_commerce_settings,public.ki_sales,public.ki_publications to authenticated;
-- Exclude actor UUID, retry payload, request IDs and internal result from browser SELECT.
grant select(id,sale_id,action,old_status,new_status,note,created_at) on public.ki_sale_events to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_commerce_settings' and policyname='ki_commerce_read') then
  create policy ki_commerce_read on public.ki_commerce_settings for select to authenticated using(id=1);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_sales' and policyname='ki_sales_read') then
  create policy ki_sales_read on public.ki_sales for select to authenticated using(owner_id=(select auth.uid()) or (select public.ki_is_admin()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_publications' and policyname='ki_publications_read') then
  create policy ki_publications_read on public.ki_publications for select to authenticated using(owner_id=(select auth.uid()) or (select public.ki_is_admin()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_sale_events' and policyname='ki_sale_events_read') then
  create policy ki_sale_events_read on public.ki_sale_events for select to authenticated using(exists(select 1 from public.ki_sales s where s.id=sale_id and (s.owner_id=(select auth.uid()) or (select public.ki_is_admin()))));
 end if;
end $$;

create or replace function public.ki_publishable_content(c jsonb,u uuid) returns boolean
language plpgsql immutable set search_path='' as $$
declare e jsonb;
begin
 if not public.ki_valid_content(c,u) or trim(c->>'groom')='' or trim(c->>'bride')='' then return false; end if;
 if c ? 'events' then
  for e in select value from jsonb_array_elements(c->'events') loop
   if trim(e->>'eventDate')='' or trim(e->>'label')='' or trim(e->>'venue')='' or trim(e->>'address')='' then return false; end if;
  end loop;
 else
  if trim(c->>'eventDate')='' or trim(c->>'venue')='' or trim(c->>'address')='' then return false; end if;
 end if;
 return true;
end $$;
revoke all on function public.ki_publishable_content(jsonb,uuid) from public,anon,authenticated;

create or replace function public.ki_sale_result(s public.ki_sales) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('id',s.id,'order_code',s.order_code,'status',s.status,'revision',s.revision,'expires_at',s.expires_at);
$$;
revoke all on function public.ki_sale_result(public.ki_sales) from public,anon,authenticated;

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
 if not public.ki_publishable_content(d.content,actor) then raise exception 'Complete event' using errcode='P4005'; end if;
 select * into t from public.ki_templates where slug=d.theme_slug and active=true and category='pernikahan' for share;
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

create or replace function public.ki_sale_action(p_id uuid,p_action text,p_revision integer,p_request uuid,p_note text,p_reference text,p_received_amount integer,p_verified boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); admin boolean; s public.ki_sales; prior public.ki_sale_events; payload jsonb; result jsonb; old text; target text;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed user required' using errcode='42501'; end if;
 admin:=public.ki_is_admin();
 if p_id is null or p_request is null or p_revision is null or p_revision<1 or p_action is null or p_action not in ('submit_payment','approve','reject','cancel','revoke')
  or p_note is null or char_length(p_note)>500 or p_reference is null or char_length(p_reference)>160 or p_received_amount is null or p_received_amount<0 or p_verified is null then raise exception 'Invalid action' using errcode='22023'; end if;
 if p_action in ('approve','reject','revoke') and not admin then raise exception 'Admin required' using errcode='42501'; end if;
 select * into s from public.ki_sales where id=p_id and (owner_id=actor or admin) for update;
 if not found then raise exception 'Access denied' using errcode='42501'; end if;
 if p_action='submit_payment' and s.owner_id<>actor then raise exception 'Owner required' using errcode='42501'; end if;
 payload:=jsonb_build_object('id',p_id,'action',p_action,'revision',p_revision,'note',trim(p_note),'reference',trim(p_reference),'amount',p_received_amount,'verified',p_verified);
 select * into prior from public.ki_sale_events where actor_id=actor and request_id=p_request;
 if found then
  if prior.action<>p_action or prior.request_payload<>payload then raise exception 'Retry differs' using errcode='P4010'; end if;
  return prior.result;
 end if;
 if s.revision<>p_revision then raise exception 'Order changed' using errcode='P4001'; end if;
 if p_action not in ('revoke','cancel') and (select count(*) from public.ki_sale_events where sale_id=p_id)>=200 then raise exception 'Audit limit; contact operator' using errcode='P0001'; end if;
 old:=s.status;
 if p_action='submit_payment' then
  if s.status not in ('awaiting_payment','rejected') then raise exception 'Invalid state' using errcode='P4009'; end if;
  if char_length(trim(p_reference))<3 then raise exception 'Transfer reference required' using errcode='22023'; end if;
  target:='awaiting_review';
 elsif p_action='approve' then
  if s.status<>'awaiting_review' then raise exception 'Invalid state' using errcode='P4009'; end if;
  if not p_verified or p_received_amount<>s.total_price or char_length(trim(p_reference))<3 then raise exception 'Received amount must match invoice' using errcode='P4008'; end if;
  target:='paid';
 elsif p_action='reject' then
  if s.status<>'awaiting_review' then raise exception 'Invalid state' using errcode='P4009'; end if;
  if char_length(trim(p_note))<5 then raise exception 'Explain rejection' using errcode='22023'; end if;
  target:='rejected';
 elsif p_action='cancel' then
  if s.status not in ('awaiting_payment','rejected') and not(admin and s.status='awaiting_review') then raise exception 'Invalid state' using errcode='P4009'; end if;
  target:='cancelled';
 elsif p_action='revoke' then
  if s.status<>'paid' then raise exception 'Invalid state' using errcode='P4009'; end if;
  if char_length(trim(p_note))<5 then raise exception 'Explain revocation' using errcode='22023'; end if;
  target:='revoked';
 end if;
 if p_action<>'approve' and (p_received_amount<>0 or p_verified) then raise exception 'Unexpected verification fields' using errcode='22023'; end if;
 update public.ki_sales set status=target,revision=revision+1,updated_at=now(),
  payment_reference=case when p_action='submit_payment' then trim(p_reference) else payment_reference end,
  admin_note=case when admin and p_action<>'submit_payment' then trim(p_note) else admin_note end,
  paid_at=case when p_action='approve' then now() else paid_at end,
  expires_at=case when p_action='approve' then now()+make_interval(days=>active_days) else expires_at end
 where id=p_id returning * into s;
 result:=public.ki_sale_result(s);
 insert into public.ki_sale_events(sale_id,actor_id,request_id,action,old_status,new_status,note,request_payload,result)
 values(p_id,actor,p_request,p_action,old,target,case when p_action='approve' then 'Mutasi telah diperiksa. '||trim(p_note) when p_action='submit_payment' then 'Konfirmasi transfer diajukan; belum diverifikasi. '||trim(p_note) else trim(p_note) end,payload,result);
 return result;
end $$;
revoke all on function public.ki_sale_action(uuid,text,integer,uuid,text,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.ki_sale_action(uuid,text,integer,uuid,text,text,integer,boolean) to authenticated;

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
  if not public.ki_publishable_content(d.content,actor) then raise exception 'Complete event' using errcode='P4005'; end if;
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

-- Anonymous lookup is single-slug, public projection only. No table SELECT for anon.
create or replace function public.ki_public_invitation(p_slug text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('slug',p.slug,'theme_slug',p.theme_slug,'content',p.content||jsonb_build_object('photoPaths','[]'::jsonb),
 'photo_count',jsonb_array_length(p.content->'photoPaths'),'revision',p.revision,'expires_at',s.expires_at)
 from public.ki_publications p join public.ki_sales s on s.id=p.sale_id
 where p.slug=p_slug and char_length(p_slug) between 5 and 64 and p.active=true and s.status='paid' and s.expires_at>now()
 and exists(select 1 from public.ki_commerce_settings where id=1 and publishing_enabled=true);
$$;
revoke all on function public.ki_public_invitation(text) from public,anon,authenticated;
grant execute on function public.ki_public_invitation(text) to anon,authenticated;

-- Elevated key is used ONLY in the server photo proxy. It never appears in client code.
-- Photo paths/owner identifiers never appear in the anonymous projection above.
create or replace function public.ki_public_photo(p_slug text,p_index integer,p_revision integer) returns text
language sql stable security definer set search_path='' as $$
 select (p.content->'photoPaths')->>p_index from public.ki_publications p join public.ki_sales s on s.id=p.sale_id
 where p.slug=p_slug and p_index between 0 and 5 and p_index<jsonb_array_length(p.content->'photoPaths') and p.revision=p_revision
 and p.active=true and s.status='paid' and s.expires_at>now()
 and exists(select 1 from public.ki_commerce_settings where id=1 and publishing_enabled=true);
$$;
revoke all on function public.ki_public_photo(text,integer,integer) from public,anon,authenticated;
grant execute on function public.ki_public_photo(text,integer,integer) to service_role;

create or replace function public.ki_update_commerce_settings(p_revision integer,p_checkout boolean,p_publishing boolean,p_days integer,p_bank text,p_account text,p_holder text,p_instructions text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg public.ki_commerce_settings;
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_revision is null or p_revision<1 or p_checkout is null or p_publishing is null or p_days is null or p_days not between 1 and 730
 or p_bank is null or char_length(p_bank)>80 or p_account is null or char_length(p_account)>50 or p_holder is null or char_length(p_holder)>120
 or p_instructions is null or char_length(p_instructions)>1500 then raise exception 'Invalid settings' using errcode='22023'; end if;
 if p_checkout and (trim(p_bank)='' or trim(p_holder)='' or trim(p_account) !~ '^[0-9][0-9 -]{3,48}[0-9]$') then raise exception 'Valid bank details required' using errcode='22023'; end if;
 select * into cfg from public.ki_commerce_settings where id=1 for update;
 if not found then raise exception 'Settings missing' using errcode='P4001'; end if;
 if cfg.revision<>p_revision then
  if cfg.revision=p_revision+1 and cfg.checkout_enabled=p_checkout and cfg.publishing_enabled=p_publishing and cfg.active_days=p_days and cfg.bank_name=trim(p_bank) and cfg.bank_account=trim(p_account) and cfg.bank_holder=trim(p_holder) and cfg.instructions=trim(p_instructions) then return jsonb_build_object('revision',cfg.revision); end if;
  raise exception 'Settings changed' using errcode='P4001';
 end if;
 update public.ki_commerce_settings set revision=revision+1,checkout_enabled=p_checkout,publishing_enabled=p_publishing,
 active_days=p_days,bank_name=trim(p_bank),bank_account=trim(p_account),bank_holder=trim(p_holder),instructions=trim(p_instructions),updated_at=now() where id=1 returning * into cfg;
 return jsonb_build_object('revision',cfg.revision);
end $$;
revoke all on function public.ki_update_commerce_settings(integer,boolean,boolean,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.ki_update_commerce_settings(integer,boolean,boolean,integer,text,text,text,text) to authenticated;

create or replace function public.ki_delete_draft(p_id uuid,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed email required' using errcode='42501'; end if;
 if p_id is null or p_expected_revision is null or p_expected_revision<1 then raise exception 'Invalid draft reference' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into row_data from public.ki_invitations where id=p_id and owner_id=actor for update;
 if not found then return jsonb_build_object('deleted',true); end if;
 if row_data.revision<>p_expected_revision then raise exception 'Version conflict' using errcode='40001'; end if;
 if exists(select 1 from public.ki_orders where invitation_id=p_id) or exists(select 1 from public.ki_sales where invitation_id=p_id) then raise exception 'Draft linked to order' using errcode='P0002'; end if;
 insert into public.ki_deleted_drafts(id,owner_id) values(p_id,actor) on conflict(id) do nothing;
 delete from public.ki_invitations where id=p_id and owner_id=actor;
 -- Media is intentionally retained, because another draft may reference it.
 return jsonb_build_object('deleted',true);
end $$;
revoke all on function public.ki_delete_draft(uuid,integer) from public,anon,authenticated;
grant execute on function public.ki_delete_draft(uuid,integer) to authenticated;


create or replace function public.ki_system_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare rls_rows jsonb; storage_extra integer; application_extra integer;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('table',expected.name,'enabled',coalesce(c.relrowsecurity,false)) order by expected.name)
 into rls_rows
 from unnest(array['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events']) as expected(name)
 left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=expected.name and c.relkind='r';
 select count(*) into storage_extra from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('ki_media_owner_insert','ki_media_owner_select');
 select count(*) into application_extra from pg_policies where schemaname='public' and tablename in ('ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events')
 and policyname not in ('ki_settings_public_read','ki_templates_public_read','ki_drafts_owner_read','ki_orders_owner_or_admin_read','ki_events_admin_read','ki_commerce_read','ki_sales_read','ki_publications_read','ki_sale_events_read');
 return jsonb_build_object(
  'schema_version',4,'tables_rls',rls_rows,
  'storage_private',exists(select 1 from storage.buckets where id='ki-media' and public=false),
  'storage_limit_ok',exists(select 1 from storage.buckets where id='ki-media' and file_size_limit>0 and file_size_limit<=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp'] and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']),
  'storage_owner_policies_present',(select count(*)=2 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('ki_media_owner_insert','ki_media_owner_select')),
  'storage_extra_policies',storage_extra,'application_extra_policies',application_extra,
  'admin_grants_restricted',not(has_table_privilege('authenticated','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'draft_direct_writes_restricted',not(has_table_privilege('authenticated','public.ki_invitations','INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_invitations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'commerce_direct_writes_restricted',not exists(select 1 from unnest(array['ki_commerce_settings','ki_sales','ki_publications','ki_sale_events']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'public_photo_rpc_private',not(has_function_privilege('anon','public.ki_public_photo(text,integer,integer)','EXECUTE') or has_function_privilege('authenticated','public.ki_public_photo(text,integer,integer)','EXECUTE')),
  'checkout_enabled',coalesce((select checkout_enabled from public.ki_commerce_settings where id=1),false),
  'publishing_enabled',coalesce((select publishing_enabled from public.ki_commerce_settings where id=1),false),
  'order_requests_enabled',coalesce((select accept_order_requests from public.ki_settings where id=1),false)
 );
end $$;
revoke all on function public.ki_system_status() from public,anon,authenticated;
grant execute on function public.ki_system_status() to authenticated;


create or replace function public.ki_schema_version() returns integer
language sql stable security invoker set search_path='' as $$ select 4; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst, 'reload schema';
commit;

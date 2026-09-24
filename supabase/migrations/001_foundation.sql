-- Kastriva Invitation 1.1.0 — run on a DEDICATED Supabase project.
-- No DROP/TRUNCATE; legacy SQLite was not present in the uploaded ZIP.
-- All user mutations use bounded, ownership-checked RPCs; no service_role key in the app.
begin;
create table if not exists public.ki_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.ki_settings (
 id integer primary key check(id=1), accept_order_requests boolean not null default false
);
insert into public.ki_settings(id,accept_order_requests) values(1,false) on conflict(id) do nothing;
create table if not exists public.ki_templates (
 slug text primary key check(slug ~ '^[a-z0-9-]{1,60}$'), name text not null,
 category text not null, description text not null, price integer not null check(price>=0),
 thumbnail text not null, colors jsonb not null, features jsonb not null, active boolean not null default true
);
create table if not exists public.ki_invitations (
 id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 theme_slug text not null references public.ki_templates(slug), content jsonb not null,
 revision integer not null default 1 check(revision>0), last_request_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint ki_draft_object check(jsonb_typeof(content)='object' and octet_length(content::text)<=32768)
);
create index if not exists ki_invitations_owner_updated_idx on public.ki_invitations(owner_id,updated_at desc);
create table if not exists public.ki_orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 invitation_id uuid not null unique references public.ki_invitations(id) on delete restrict,
 order_code text not null unique default ('KI-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 theme_slug text not null references public.ki_templates(slug),
 customer_email text not null, customer_name text not null check(char_length(customer_name) between 2 and 100),
 customer_phone text not null check(customer_phone ~ '^62[0-9]{8,13}$'),
 total_price integer not null check(total_price>=0), snapshot jsonb not null,
 status text not null default 'new' check(status in ('new','contacted','processing','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ki_orders_owner_created_idx on public.ki_orders(owner_id,created_at desc);
create index if not exists ki_orders_created_idx on public.ki_orders(created_at desc);
create table if not exists public.ki_order_events (
 id bigint generated always as identity primary key, order_id uuid not null references public.ki_orders(id) on delete cascade,
 actor_id uuid not null, old_status text not null, new_status text not null, created_at timestamptz not null default now()
);
alter table public.ki_admins enable row level security;
alter table public.ki_settings enable row level security;
alter table public.ki_templates enable row level security;
alter table public.ki_invitations enable row level security;
alter table public.ki_orders enable row level security;
alter table public.ki_order_events enable row level security;
-- First revoke default privileges. A policy by itself does not remove Supabase defaults.
revoke all on public.ki_admins,public.ki_settings,public.ki_templates,public.ki_invitations,public.ki_orders,public.ki_order_events from public,anon,authenticated;
grant select on public.ki_settings,public.ki_templates to anon,authenticated;
grant select on public.ki_invitations,public.ki_orders,public.ki_order_events to authenticated;

create or replace function public.ki_is_admin() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.ki_admins where user_id=(select auth.uid())); $$;
revoke all on function public.ki_is_admin() from public,anon,authenticated;
grant execute on function public.ki_is_admin() to authenticated;

-- Idempotent policy creation without destructive drops.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_settings' and policyname='ki_settings_public_read') then
  create policy ki_settings_public_read on public.ki_settings for select to anon,authenticated using(id=1);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_templates' and policyname='ki_templates_public_read') then
  create policy ki_templates_public_read on public.ki_templates for select to anon,authenticated using(active=true);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_invitations' and policyname='ki_drafts_owner_read') then
  create policy ki_drafts_owner_read on public.ki_invitations for select to authenticated using(owner_id=(select auth.uid()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_orders' and policyname='ki_orders_owner_or_admin_read') then
  create policy ki_orders_owner_or_admin_read on public.ki_orders for select to authenticated using(owner_id=(select auth.uid()) or (select public.ki_is_admin()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ki_order_events' and policyname='ki_events_admin_read') then
  create policy ki_events_admin_read on public.ki_order_events for select to authenticated using((select public.ki_is_admin()));
 end if;
end $$;

create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare f record; photo jsonb; date_value text; allowed text[] := array['groom','bride','groomParents','brideParents','eventDate','eventTime','endTime','timezone','venue','address','mapUrl','opening','story','photoPaths'];
begin
 if p_content is null or p_owner is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 if not (p_content ?& allowed) or exists(select 1 from jsonb_object_keys(p_content) as keys(key) where not(key=any(allowed))) then return false; end if;
 for f in select * from (values ('groom',100),('bride',100),('groomParents',200),('brideParents',200),('eventDate',10),('eventTime',5),('endTime',5),('timezone',20),('venue',200),('address',500),('mapUrl',1000),('opening',1000),('story',4000)) as lim(key,max_len) loop
  if jsonb_typeof(p_content->f.key)<>'string' or char_length(p_content->>f.key)>f.max_len then return false; end if;
 end loop;
 if (p_content->>'timezone') not in ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura') then return false; end if;
 if (p_content->>'eventTime') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (p_content->>'endTime') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (p_content->>'endTime') <= (p_content->>'eventTime') then return false; end if;
 date_value:=p_content->>'eventDate';
 if date_value<>'' then
  if date_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or substring(date_value,1,4)::integer<2020 or to_char(to_date(date_value,'YYYY-MM-DD'),'YYYY-MM-DD')<>date_value then return false; end if;
 end if;
 if (p_content->>'mapUrl')<>'' and (p_content->>'mapUrl') !~ '^https://[^[:space:]@/]+(/[^[:space:]]*)?$' then return false; end if;
 if jsonb_typeof(p_content->'photoPaths')<>'array' or jsonb_array_length(p_content->'photoPaths')>6 then return false; end if;
 for photo in select value from jsonb_array_elements(p_content->'photoPaths') loop
  if jsonb_typeof(photo)<>'string' or (photo#>>'{}') !~ ('^'||p_owner::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg|png)$') then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.ki_valid_content(jsonb,uuid) from public,anon,authenticated;

create or replace function public.ki_save_draft(p_id uuid,p_theme text,p_content jsonb,p_expected_revision integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations; count_drafts integer;
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0 or not public.ki_valid_content(p_content,actor) then raise exception 'Invalid draft' using errcode='22023'; end if;
 if not exists(select 1 from public.ki_templates where slug=p_theme and active=true and category='pernikahan') then raise exception 'Invalid theme' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into row_data from public.ki_invitations where id=p_id and owner_id=actor for update;
 if found then
  if row_data.last_request_id=p_request_id then
   if row_data.content<>p_content or row_data.theme_slug<>p_theme then raise exception 'Retry payload differs' using errcode='22023'; end if;
   return jsonb_build_object('id',row_data.id,'revision',row_data.revision,'updated_at',row_data.updated_at);
  end if;
  if row_data.revision<>p_expected_revision then raise exception 'Version conflict' using errcode='40001'; end if;
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
 if trim(draft.content->>'groom')='' or trim(draft.content->>'bride')='' or (draft.content->>'eventDate')='' or trim(draft.content->>'venue')='' then raise exception 'Complete event first' using errcode='22023'; end if;
 select price into template_price from public.ki_templates where slug=draft.theme_slug and active=true and category='pernikahan';
 if template_price is null then raise exception 'Theme unavailable' using errcode='22023'; end if;
 insert into public.ki_orders(owner_id,invitation_id,theme_slug,customer_email,customer_name,customer_phone,total_price,snapshot)
 values(actor,p_invitation,draft.theme_slug,email_value,trim(p_name),p_phone,template_price,draft.content) returning * into result;
 return jsonb_build_object('id',result.id,'order_code',result.order_code,'status',result.status,'total_price',result.total_price);
end $$;
revoke all on function public.ki_request_order(uuid,text,text) from public,anon,authenticated;
grant execute on function public.ki_request_order(uuid,text,text) to authenticated;

create or replace function public.ki_update_order_status(p_id uuid,p_status text) returns void
language plpgsql security definer set search_path=''
as $$
declare current_status text;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_status is null or p_status not in ('new','contacted','processing','cancelled') then raise exception 'Invalid status' using errcode='22023'; end if;
 select status into current_status from public.ki_orders where id=p_id for update;
 if not found then raise exception 'Not found' using errcode='22023'; end if;
 if current_status=p_status then return; end if;
 if current_status='cancelled' or (current_status='processing' and p_status not in ('contacted','cancelled')) or (current_status='contacted' and p_status='new') then raise exception 'Invalid transition' using errcode='22023'; end if;
 update public.ki_orders set status=p_status,updated_at=now() where id=p_id;
 insert into public.ki_order_events(order_id,actor_id,old_status,new_status) values(p_id,auth.uid(),current_status,p_status);
end $$;
revoke all on function public.ki_update_order_status(uuid,text) from public,anon,authenticated;
grant execute on function public.ki_update_order_status(uuid,text) to authenticated;

-- Private media: unguessable paths, owner-only access, 5 MB object limit; no public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ki-media','ki-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ki_media_owner_insert') then
  create policy ki_media_owner_insert on storage.objects for insert to authenticated with check(bucket_id='ki-media' and name ~ ('^'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg|png)$'));
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ki_media_owner_select') then
  create policy ki_media_owner_select on storage.objects for select to authenticated using(bucket_id='ki-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
 end if;
end $$;
-- No client UPDATE/DELETE Storage policy yet: replacing media is immutable and cleanup is manual.

-- Preserve eight themes from the input project; no fabricated user statistics.
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('elegant-rose','Elegant Rose','pernikahan','Tema pernikahan klasik dengan nuansa bunga mawar merah muda yang elegan dan romantis.',150000,'🌹','["#D4A5A5", "#F5E6E8", "#8B4513"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('modern-minimalist','Modern Minimalist','pernikahan','Desain clean dan modern dengan tipografi bold untuk pasangan yang menyukai kesederhanaan.',150000,'✨','["#2C3E50", "#ECF0F1", "#E74C3C"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('tropical-paradise','Tropical Paradise','pernikahan','Nuansa tropis dengan daun monstera dan warna-warna cerah untuk pernikahan outdoor.',200000,'🌴','["#2ECC71", "#F39C12", "#1ABC9C"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('rustic-wood','Rustic Wood','pernikahan','Tema rustic dengan elemen kayu dan bunga kering yang hangat dan natural.',175000,'🪵','["#8B6914", "#DEB887", "#556B2F"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('galaxy-night','Galaxy Night','pernikahan','Tema malam berbintang dengan nuansa galaxy yang memukau dan dramatis.',250000,'🌌','["#0C0C2E", "#6C3483", "#F4D03F"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('sweet-birthday','Sweet Birthday','ulang-tahun','Tema ulang tahun ceria dengan balon dan confetti untuk si kecil maupun dewasa.',75000,'🎂','["#FF6B6B", "#4ECDC4", "#FFE66D"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('aqiqah-blessing','Aqiqah Blessing','aqiqah','Undangan aqiqah dengan nuansa islami yang lembut dan penuh berkah.',75000,'🕌','["#27AE60", "#F0F3F4", "#2C3E50"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active) values ('corporate-event','Corporate Event','acara-kantor','Desain profesional untuk gathering, launching, atau acara perusahaan.',200000,'🏢','["#2C3E50", "#3498DB", "#ECF0F1"]'::jsonb,'["Sampul personal", "Hitung mundur", "Informasi acara", "Tautan lokasi", "Preview sebelum pesan"]'::jsonb,true) on conflict(slug) do nothing;

commit;

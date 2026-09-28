-- v1.9.0: Ucapan & doa from general invitation links, independent of personal RSVP.
-- Default CLOSED at database and per-invitation levels. Does not modify any earlier migration,
-- RSVP, payment, price, publication snapshot, media bucket or schema-7 contract.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if to_regprocedure('public.ki_feature_readiness()') is null or public.ki_schema_version()<>7 then
  raise exception 'Install through 012 before 013. Do not change version markers manually';
 end if;
end $$;
create table if not exists public.ki_open_wish_platform (
 id integer primary key check(id=1), enabled boolean not null default false,
 revision integer not null default 1 check(revision>0), last_request uuid, last_payload jsonb
);
insert into public.ki_open_wish_platform(id) values(1) on conflict(id) do nothing;
create table if not exists public.ki_open_wish_settings (
 sale_id uuid primary key references public.ki_sales(id) on delete restrict,
 accepting boolean not null default false, showing boolean not null default false,
 revision integer not null default 1 check(revision>0)
);
create table if not exists public.ki_open_wishes (
 id uuid primary key, sale_id uuid not null references public.ki_sales(id) on delete restrict,
 sequence bigint generated always as identity unique,
 name text not null check(public.ki_guest_valid_text(name,0,80)),
 message text not null check(public.ki_guest_valid_text(message,0,500)),
 consent boolean not null, moderation text not null default 'pending' check(moderation in ('pending','approved','hidden')),
 removed boolean not null default false, receipt_hash text not null check(receipt_hash ~ '^[a-f0-9]{64}$'),
 input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
 revision integer not null default 1 check(revision>0), created_at timestamptz not null default now(),
 check((removed and name='' and message='' and not consent and moderation='hidden')
  or (not removed and name<>'' and message<>'')),
 check(moderation<>'approved' or consent)
);
create index if not exists ki_open_wishes_sale_sequence on public.ki_open_wishes(sale_id,sequence desc);
create table if not exists public.ki_open_wish_network (
 sale_id uuid not null references public.ki_sales(id) on delete restrict,
 identity_hash text not null check(identity_hash ~ '^[a-f0-9]{64}$'),
 window_at timestamptz not null, last_at timestamptz not null, hits integer not null check(hits between 1 and 5),
 primary key(sale_id,identity_hash)
);
create table if not exists public.ki_open_wish_actions (
 id bigint generated always as identity primary key,
 sale_id uuid not null references public.ki_sales(id) on delete restrict, actor uuid not null,
 request_id uuid not null, payload jsonb not null, result jsonb not null,
 created_at timestamptz not null default now(), unique(actor,request_id)
);
create index if not exists ki_open_wish_actions_sale on public.ki_open_wish_actions(sale_id,id desc);
-- No direct Data API access, even for ordinary logged-in users. All owner RPCs verify auth.uid().
alter table public.ki_open_wish_platform enable row level security;
alter table public.ki_open_wish_settings enable row level security;
alter table public.ki_open_wishes enable row level security;
alter table public.ki_open_wish_network enable row level security;
alter table public.ki_open_wish_actions enable row level security;
revoke all on public.ki_open_wish_platform,public.ki_open_wish_settings,public.ki_open_wishes,public.ki_open_wish_network,public.ki_open_wish_actions from public,anon,authenticated;
revoke all on sequence public.ki_open_wishes_sequence_seq,public.ki_open_wish_actions_id_seq from public,anon,authenticated;

create or replace function public.ki_open_wish_version() returns integer
language sql stable set search_path='' as $$ select 1 $$;
revoke all on function public.ki_open_wish_version() from public,anon,authenticated;
grant execute on function public.ki_open_wish_version() to anon,authenticated,service_role;

-- No dependency on ki_guest_platform: general wishes do not grant or require RSVP access.
create or replace function public.ki_open_wish_live_sale(p_slug text) returns uuid
language sql stable security definer set search_path='' as $$
 select s.id from public.ki_sales s join public.ki_publications p on p.sale_id=s.id
 where p.slug=p_slug and p.active and s.status='paid' and s.expires_at>now()
 and exists(select 1 from public.ki_commerce_settings where id=1 and publishing_enabled);
$$;
revoke all on function public.ki_open_wish_live_sale(text) from public,anon,authenticated;

create or replace function public.ki_open_wish_feed(p_slug text,p_before bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare sid uuid; cfg public.ki_open_wish_settings; enabled boolean; items jsonb; next_id text;
begin
 if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) not between 5 and 64 or (p_before is not null and p_before<1) then raise exception 'Invalid query' using errcode='22023';end if;
 sid:=public.ki_open_wish_live_sale(p_slug);
 select * into cfg from public.ki_open_wish_settings where sale_id=sid;
 enabled:=sid is not null and coalesce((select p.enabled from public.ki_open_wish_platform p where id=1),false);
 items:='[]'::jsonb;
 if enabled and coalesce(cfg.showing,false) then
  select coalesce(jsonb_agg(jsonb_build_object('id',w.sequence::text,'name',w.name,'message',w.message,'updated_at',w.created_at) order by w.sequence desc),'[]'::jsonb)
  into items from (select * from public.ki_open_wishes where sale_id=sid and consent and moderation='approved' and not removed
   and (p_before is null or sequence<p_before) order by sequence desc limit 20) w;
  if jsonb_array_length(items)=20 then next_id:=items->19->>'id';end if;
 end if;
 return jsonb_build_object('accepting',enabled and coalesce(cfg.accepting,false),
 'showing',enabled and coalesce(cfg.showing,false),'items',items,'next',next_id);
end $$;
revoke all on function public.ki_open_wish_feed(text,bigint) from public,anon,authenticated;
grant execute on function public.ki_open_wish_feed(text,bigint) to service_role;

create or replace function public.ki_open_wish_submit(p_slug text,p_id uuid,p_receipt text,p_name text,p_message text,p_consent boolean,p_network text) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare sid uuid; receipt_digest text; body_digest text; old public.ki_open_wishes; budget public.ki_open_wish_network;
 t timestamptz:=clock_timestamp();
begin
 if p_id is null or p_receipt is null or p_receipt !~ '^[a-f0-9]{64}$' or p_network is null or p_network !~ '^[a-f0-9]{64}$'
 or not public.ki_guest_valid_text(p_name,1,80) or not public.ki_guest_valid_text(p_message,1,500) or p_consent is null then
  raise exception 'Invalid wish' using errcode='22023';end if;
 -- Resolve even an inactive slug for safe replay. Access to a response still requires the private receipt.
 select sale_id into sid from public.ki_publications where slug=p_slug;
 if sid is null then raise exception 'Unavailable' using errcode='P1302';end if;
 perform 1 from public.ki_sales where id=sid for update;
 t:=clock_timestamp();
 receipt_digest:=encode(sha256(convert_to(p_receipt,'UTF8')),'hex');
 body_digest:=encode(sha256(convert_to(jsonb_build_object('slug',p_slug,'name',p_name,'message',p_message,'consent',p_consent)::text,'UTF8')),'hex');
 select * into old from public.ki_open_wishes where id=p_id;
 if found then
  if old.sale_id<>sid or old.receipt_hash<>receipt_digest or old.input_hash<>body_digest then raise exception 'Request conflict' using errcode='P1306';end if;
  -- A replay only acknowledges the original receipt. It never re-publishes a moderated/removed entry.
  return jsonb_build_object('id',p_id,'received',true);
 end if;
 if public.ki_open_wish_live_sale(p_slug) is distinct from sid
 or not coalesce((select enabled from public.ki_open_wish_platform where id=1),false)
 or not coalesce((select accepting from public.ki_open_wish_settings where sale_id=sid),false) then
  raise exception 'Closed' using errcode='P1302';end if;
 -- Serialised by sale lock: parallel posts cannot exceed either account or network budgets.
 if (select count(*) from public.ki_open_wishes where sale_id=sid)>=2000 then raise exception 'Capacity' using errcode='P1305';end if;
 select * into budget from public.ki_open_wish_network where sale_id=sid and identity_hash=p_network;
 if found and budget.window_at>t-interval '24 hours' and (budget.hits>=5 or budget.last_at>t-interval '30 seconds') then
  raise exception 'Rate limit' using errcode='P1304';end if;
 delete from public.ki_open_wish_network where sale_id=sid and last_at<t-interval '2 days';
 insert into public.ki_open_wish_network(sale_id,identity_hash,window_at,last_at,hits) values(sid,p_network,t,t,1)
 on conflict(sale_id,identity_hash) do update set
 hits=case when public.ki_open_wish_network.window_at<=t-interval '24 hours' then 1 else public.ki_open_wish_network.hits+1 end,
 window_at=case when public.ki_open_wish_network.window_at<=t-interval '24 hours' then t else public.ki_open_wish_network.window_at end,last_at=t;
 insert into public.ki_open_wishes(id,sale_id,name,message,consent,moderation,receipt_hash,input_hash)
 values(p_id,sid,p_name,p_message,p_consent,case when p_consent then 'pending' else 'hidden' end,receipt_digest,body_digest);
 return jsonb_build_object('id',p_id,'received',true);
end $$;
revoke all on function public.ki_open_wish_submit(text,uuid,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.ki_open_wish_submit(text,uuid,text,text,text,boolean,text) to service_role;

-- Receipt authorises removal only, not editing another visitor's text or accessing RSVP.
-- Removal stays available with receipt when intake/publication has closed or expired.
create or replace function public.ki_open_wish_withdraw(p_slug text,p_id uuid,p_receipt text) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare sid uuid; old public.ki_open_wishes;
begin
 if p_id is null or p_receipt is null or p_receipt !~ '^[a-f0-9]{64}$' then raise exception 'Invalid receipt' using errcode='22023';end if;
 select sale_id into sid from public.ki_publications where slug=p_slug;
 if sid is null then raise exception 'Invalid receipt' using errcode='P1303';end if;
 perform 1 from public.ki_sales where id=sid for update;
 select * into old from public.ki_open_wishes where id=p_id and sale_id=sid;
 if not found or old.receipt_hash<>encode(sha256(convert_to(p_receipt,'UTF8')),'hex') then raise exception 'Invalid receipt' using errcode='P1303';end if;
 if not old.removed then update public.ki_open_wishes set removed=true,name='',message='',consent=false,moderation='hidden',revision=revision+1 where id=p_id;end if;
 return jsonb_build_object('id',p_id,'removed',true);
end $$;
revoke all on function public.ki_open_wish_withdraw(text,uuid,text) from public,anon,authenticated;
grant execute on function public.ki_open_wish_withdraw(text,uuid,text) to service_role;

create or replace function public.ki_open_wish_workspace(p_sale uuid,p_filter text default 'all',p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.ki_sales; cfg public.ki_open_wish_settings; slug_value text; rows_json jsonb; total integer; stats jsonb;
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() then raise exception 'Owner required' using errcode='42501';end if;
 select * into s from public.ki_sales where id=p_sale and owner_id=auth.uid();
 if not found then raise exception 'Owner required' using errcode='42501';end if;
 if p_filter is null or p_filter not in ('all','pending','approved','hidden','private','removed') or p_offset is null or p_offset not between 0 and 2000 then raise exception 'Invalid query' using errcode='22023';end if;
 select * into cfg from public.ki_open_wish_settings where sale_id=p_sale;
 select slug into slug_value from public.ki_publications where sale_id=p_sale;
 select jsonb_build_object('total',count(*),'pending',count(*) filter(where not removed and consent and moderation='pending'),
 'approved',count(*) filter(where not removed and consent and moderation='approved'),'private',count(*) filter(where not removed and not consent))
 into stats from public.ki_open_wishes where sale_id=p_sale;
 with filtered as (
 select id,name,message,consent,moderation,removed,revision,created_at,sequence from public.ki_open_wishes
 where sale_id=p_sale and (p_filter='all' or (p_filter='removed' and removed) or (not removed and ((p_filter='private' and not consent) or (consent and moderation=p_filter)))))
 select (select count(*) from filtered),coalesce((select jsonb_agg(to_jsonb(q) - 'sequence' order by sequence desc) from
 (select * from filtered order by sequence desc offset p_offset limit 20) q),'[]'::jsonb) into total,rows_json;
 return jsonb_build_object('sale_id',p_sale,'slug',slug_value,
 'live',public.ki_open_wish_live_sale(slug_value) is not null,
 'can_open',s.status='paid' and coalesce(s.expires_at>now(),false),
 'platform_enabled',coalesce((select enabled from public.ki_open_wish_platform where id=1),false),
 'settings',jsonb_build_object('revision',coalesce(cfg.revision,0),'accepting',coalesce(cfg.accepting,false),'showing',coalesce(cfg.showing,false)),
 'stats',stats,'rows',rows_json,'total',total,'offset',p_offset);
end $$;
revoke all on function public.ki_open_wish_workspace(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.ki_open_wish_workspace(uuid,text,integer) to authenticated;

create or replace function public.ki_open_wish_manage(p_sale uuid,p_request uuid,p_action text,p_revision integer,p_entry uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare who uuid:=auth.uid(); s public.ki_sales; cfg public.ki_open_wish_settings; w public.ki_open_wishes;
 old public.ki_open_wish_actions; payload jsonb; result jsonb; next_revision integer;
begin
 if who is null or not public.ki_has_confirmed_email() then raise exception 'Owner required' using errcode='42501';end if;
 select * into s from public.ki_sales where id=p_sale and owner_id=who for update;
 if not found then raise exception 'Owner required' using errcode='42501';end if;
 if p_request is null or p_revision is null or p_revision not between 0 and 2147483646 or p_action is null or p_action not in ('settings','approve','hide','remove') then raise exception 'Invalid action' using errcode='22023';end if;
 payload:=jsonb_build_object('sale',p_sale,'action',p_action,'revision',p_revision,'entry',p_entry,'data',p_data);
 select * into old from public.ki_open_wish_actions a where a.request_id=p_request and a.actor=who;
 if found then
  if old.payload<>payload then raise exception 'Request conflict' using errcode='P1306';end if;
  return old.result;
 end if;
 if p_action in ('settings','approve') and (select count(*) from public.ki_open_wish_actions where sale_id=p_sale and created_at>now()-interval '1 minute')>=40 then raise exception 'Rate limit' using errcode='P1304';end if;
 if p_action='settings' then
  if p_entry is not null or not public.ki_guest_keys(p_data,array['accepting','showing']) or jsonb_typeof(p_data->'accepting')<>'boolean' or jsonb_typeof(p_data->'showing')<>'boolean' then raise exception 'Invalid settings' using errcode='22023';end if;
  select * into cfg from public.ki_open_wish_settings where sale_id=p_sale;
  if coalesce(cfg.revision,0)<>p_revision then raise exception 'Conflict' using errcode='P1301';end if;
  if ((p_data->>'accepting')::boolean or (p_data->>'showing')::boolean) and (s.status<>'paid' or not coalesce(s.expires_at>now(),false)) then raise exception 'Inactive order' using errcode='P1302';end if;
  next_revision:=p_revision+1;
  insert into public.ki_open_wish_settings(sale_id,accepting,showing,revision)
  values(p_sale,(p_data->>'accepting')::boolean,(p_data->>'showing')::boolean,next_revision)
  on conflict(sale_id) do update set accepting=excluded.accepting,showing=excluded.showing,revision=excluded.revision;
 else
  if p_entry is null or p_revision<1 or not public.ki_guest_keys(p_data,array[]::text[]) then raise exception 'Invalid entry' using errcode='22023';end if;
  select * into w from public.ki_open_wishes where id=p_entry and sale_id=p_sale;
  if not found or w.revision<>p_revision then raise exception 'Conflict' using errcode='P1301';end if;
  if w.removed then raise exception 'Entry removed' using errcode='P1301';end if;
  next_revision:=p_revision+1;
  if p_action='approve' then
   if not w.consent then raise exception 'Consent required' using errcode='22023';end if;
   if s.status<>'paid' or not coalesce(s.expires_at>now(),false) then raise exception 'Inactive order' using errcode='P1302';end if;
   update public.ki_open_wishes set moderation='approved',revision=next_revision where id=p_entry;
  elsif p_action='hide' then
   update public.ki_open_wishes set moderation='hidden',revision=next_revision where id=p_entry;
  else
   update public.ki_open_wishes set name='',message='',consent=false,moderation='hidden',removed=true,revision=next_revision where id=p_entry;
  end if;
 end if;
 result:=jsonb_build_object('sale_id',p_sale,'request_id',p_request,'action',p_action,'revision',next_revision);
 insert into public.ki_open_wish_actions(sale_id,actor,request_id,payload,result) values(p_sale,who,p_request,payload,result);
 -- Metadata-only journals. No name, message or visitor receipt is copied into owner history.
 delete from public.ki_open_wish_actions where sale_id=p_sale and id in
 (select id from public.ki_open_wish_actions where sale_id=p_sale order by id desc offset 500);
 return result;
end $$;
revoke all on function public.ki_open_wish_manage(uuid,uuid,text,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ki_open_wish_manage(uuid,uuid,text,integer,uuid,jsonb) to authenticated;

create or replace function public.ki_open_wish_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() or not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 return (select jsonb_build_object('enabled',enabled,'revision',revision) from public.ki_open_wish_platform where id=1);
end $$;
revoke all on function public.ki_open_wish_admin() from public,anon,authenticated;
grant execute on function public.ki_open_wish_admin() to authenticated;
create or replace function public.ki_open_wish_admin_set(p_request uuid,p_revision integer,p_enabled boolean) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare cfg public.ki_open_wish_platform; payload jsonb;
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() or not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if p_request is null or p_revision is null or p_revision not between 1 and 2147483646 or p_enabled is null then raise exception 'Invalid settings' using errcode='22023';end if;
 payload:=jsonb_build_object('revision',p_revision,'enabled',p_enabled,'actor',auth.uid());
 select * into cfg from public.ki_open_wish_platform where id=1 for update;
 if not found then raise exception 'Platform settings unavailable' using errcode='P1300';end if;
 if cfg.last_request=p_request then
  if cfg.last_payload<>payload then raise exception 'Request conflict' using errcode='P1306';end if;
 elsif cfg.revision<>p_revision then raise exception 'Conflict' using errcode='P1301';
 else
  update public.ki_open_wish_platform set enabled=p_enabled,revision=revision+1,last_request=p_request,last_payload=payload where id=1;
 end if;
 return jsonb_build_object('request_id',p_request,'revision',p_revision+1,'enabled',p_enabled);
end $$;
revoke all on function public.ki_open_wish_admin_set(uuid,integer,boolean) from public,anon,authenticated;
grant execute on function public.ki_open_wish_admin_set(uuid,integer,boolean) to authenticated;

create or replace function public.ki_open_wish_audit() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare tables_ok boolean; grants_ok boolean; gateway_ok boolean;
 names text[]:=array['ki_open_wish_platform','ki_open_wish_settings','ki_open_wishes','ki_open_wish_network','ki_open_wish_actions'];
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() or not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 select count(*)=5 and coalesce(bool_and(c.relrowsecurity),false) into tables_ok
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname=any(names);
 select not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 cross join (values('anon'),('authenticated')) roles(name)
 where n.nspname='public' and c.relname=any(names) and pg_catalog.has_table_privilege(roles.name,c.oid,'SELECT,INSERT,UPDATE,DELETE')) into grants_ok;
 select count(*)=3 and coalesce(bool_and(not pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') and not pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') and pg_catalog.has_function_privilege('service_role',p.oid,'EXECUTE')),false) into gateway_ok
 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('ki_open_wish_feed','ki_open_wish_submit','ki_open_wish_withdraw');
 return jsonb_build_object('tables_rls',tables_ok,'browser_tables_blocked',grants_ok,'public_rpc_gateway_only',gateway_ok);
end $$;
revoke all on function public.ki_open_wish_audit() from public,anon,authenticated;
grant execute on function public.ki_open_wish_audit() to authenticated;

-- A separate fixed diagnostic contract; keep 012 byte-for-byte and compatible with v1.8 clients.
comment on function public.ki_open_wish_version() is 'General wishes protocol 1 / migration 013, not proof of a completed production test.';
notify pgrst,'reload schema';
commit;

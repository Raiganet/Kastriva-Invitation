-- Kastriva Invitation 1.5.0. Additive; run AFTER 004 on the same staging project.
-- Guest links are bearer credentials, not proof of a person's real identity.
-- All new tables deny direct client access; only narrowly scoped RPCs are exposed.
begin;
do $$ begin
 if to_regprocedure('public.ki_schema_version()') is null then raise exception 'Install 001-004 first'; end if;
 if public.ki_schema_version() not in (4,5) then raise exception '005 requires schema 4/5; do not downgrade'; end if;
end $$;
create table if not exists public.ki_guest_platform (
 id integer primary key check(id=1), enabled boolean not null default false,
 revision integer not null default 1 check(revision>0), updated_at timestamptz not null default now()
);
insert into public.ki_guest_platform(id) values(1) on conflict(id) do nothing;
create table if not exists public.ki_guest_settings (
 sale_id uuid primary key references public.ki_sales(id) on delete restrict,
 owner_id uuid not null references auth.users(id) on delete restrict,
 accepting boolean not null default false, show_wishes boolean not null default false,
 revision integer not null default 1 check(revision>0), updated_at timestamptz not null default now()
);
create table if not exists public.ki_guests (
 id uuid primary key, sale_id uuid not null references public.ki_sales(id) on delete restrict,
 owner_id uuid not null references auth.users(id) on delete restrict,
 name text not null check(char_length(trim(name)) between 1 and 100),
 max_people integer not null default 1 check(max_people between 1 and 10), active boolean not null default true,
 -- Two independent random UUID v4s: 244 random bits. No additional extension required.
 token text not null unique default (replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')) check(token ~ '^[a-f0-9]{64}$'),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ki_guests_sale_created on public.ki_guests(sale_id,created_at desc,id);
create table if not exists public.ki_rsvps (
 guest_id uuid primary key references public.ki_guests(id) on delete cascade,
 public_id bigint generated always as identity unique,
 attendance text not null check(attendance in ('yes','no','maybe')),
 people integer not null check(people between 0 and 10),
 message text not null default '' check(char_length(message)<=500),
 display_name text not null default '' check(char_length(display_name)<=80),
 consent boolean not null default false,
 moderation text not null default 'pending' check(moderation in ('pending','approved','hidden')),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(), submitted_at timestamptz not null default now(),
 rate_window timestamptz not null default now(), rate_count integer not null default 1 check(rate_count between 1 and 20),
 last_request uuid not null, last_payload jsonb not null, last_result jsonb not null default '{}',
 check((attendance='yes' and people>=1) or (attendance in ('no','maybe') and people=0)),
 check(not consent or (trim(display_name)<>'' and trim(message)<>'')),
 check(consent or display_name=''), check(moderation<>'approved' or consent)
);
create table if not exists public.ki_guest_mutations (
 id bigint generated always as identity primary key,
 sale_id uuid not null references public.ki_sales(id) on delete restrict,
 actor_id uuid not null, request_id uuid not null, request_payload jsonb not null,
 result jsonb not null, created_at timestamptz not null default now(), unique(actor_id,request_id)
);
create index if not exists ki_guest_mutations_sale_id on public.ki_guest_mutations(sale_id,id desc);
alter table public.ki_guest_platform enable row level security;
alter table public.ki_guest_settings enable row level security;
alter table public.ki_guests enable row level security;
alter table public.ki_rsvps enable row level security;
alter table public.ki_guest_mutations enable row level security;
revoke all on public.ki_guest_platform,public.ki_guest_settings,public.ki_guests,public.ki_rsvps,public.ki_guest_mutations from public,anon,authenticated;
revoke all on sequence public.ki_rsvps_public_id_seq,public.ki_guest_mutations_id_seq from public,anon,authenticated;

-- Match browser validation even when a caller bypasses the Next.js API.
-- Control characters or overlong UTF-16 strings must not poison owner list parsing.
create or replace function public.ki_guest_valid_text(v text,min_units integer,max_units integer) returns boolean
language sql immutable set search_path='' as $$
 select case when v is null or min_units<0 or max_units<min_units then false
 when char_length(v)>max_units then false
 when v<>btrim(v,U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') then false
 when translate(v,E'\t\n\r','') ~ '[[:cntrl:]]' then false
 else coalesce((select sum(case when ch='' then 0 when ascii(ch)>65535 then 2 else 1 end) from regexp_split_to_table(v,'') as chars(ch)),0) between min_units and max_units end;
$$;
revoke all on function public.ki_guest_valid_text(text,integer,integer) from public,anon,authenticated;

create or replace function public.ki_guest_keys(j jsonb,keys text[]) returns boolean
language sql immutable set search_path='' as $$
 select case when jsonb_typeof(j)='object' then
  (select count(*)=cardinality(keys) and coalesce(bool_and(k=any(keys)),true) from jsonb_object_keys(j) k)
 else false end;
$$;
revoke all on function public.ki_guest_keys(jsonb,text[]) from public,anon,authenticated;

create or replace function public.ki_guest_response(r public.ki_rsvps) returns jsonb
language sql immutable set search_path='' as $$
 select case when r.guest_id is null then null else jsonb_build_object(
  'attendance',r.attendance,'people',r.people,'message',r.message,'display_name',r.display_name,
  'consent',r.consent,'moderation',r.moderation,'revision',r.revision,'updated_at',r.updated_at) end;
$$;
revoke all on function public.ki_guest_response(public.ki_rsvps) from public,anon,authenticated;

-- Helper is NOT granted to browser roles. No private data is returned by public projections.
create or replace function public.ki_guest_live_sale(p_slug text) returns uuid
language sql stable security definer set search_path='' as $$
 select s.id from public.ki_sales s join public.ki_publications p on p.sale_id=s.id
 where p.slug=p_slug and p.active and s.status='paid' and s.expires_at>now()
 and exists(select 1 from public.ki_commerce_settings where id=1 and publishing_enabled)
 and exists(select 1 from public.ki_guest_platform where id=1 and enabled);
$$;
revoke all on function public.ki_guest_live_sale(text) from public,anon,authenticated;

create or replace function public.ki_guest_workspace(p_sale uuid,p_query text default '',p_filter text default 'all',p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s public.ki_sales; cfg public.ki_guest_settings; slug_value text; rows_json jsonb; stats_json jsonb; total_rows integer;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Owner required' using errcode='42501'; end if;
 select * into s from public.ki_sales where id=p_sale and owner_id=actor;
 if not found then raise exception 'Owner required' using errcode='42501'; end if;
 if p_offset is null or p_offset not between 0 and 500 or not public.ki_guest_valid_text(p_query,0,100)
 or p_filter is null or p_filter not in ('all','yes','no','maybe','unanswered','pending','hidden','approved','inactive') then raise exception 'Invalid query' using errcode='22023'; end if;
 select * into cfg from public.ki_guest_settings where sale_id=p_sale;
 select slug into slug_value from public.ki_publications where sale_id=p_sale;
 select jsonb_build_object('registered',count(*),'active',count(*) filter(where g.active),
  'yes',count(*) filter(where g.active and r.attendance='yes'),'no',count(*) filter(where g.active and r.attendance='no'),
  'maybe',count(*) filter(where g.active and r.attendance='maybe'),'unanswered',count(*) filter(where g.active and r.guest_id is null),
  'people',coalesce(sum(r.people) filter(where g.active and r.attendance='yes'),0),
  'pending',count(*) filter(where g.active and r.moderation='pending' and r.consent))
 into stats_json from public.ki_guests g left join public.ki_rsvps r on r.guest_id=g.id where g.sale_id=p_sale;
 with filtered as (
  select g.id,g.name,g.max_people,g.active,g.revision,g.created_at,public.ki_guest_response(r) as response
  from public.ki_guests g left join public.ki_rsvps r on r.guest_id=g.id
  where g.sale_id=p_sale and (p_query='' or position(lower(p_query) in lower(g.name))>0)
  and (p_filter='all' or (p_filter='inactive' and not g.active) or (g.active and (
   p_filter=r.attendance or (p_filter='unanswered' and r.guest_id is null) or p_filter=r.moderation)))
 ), paged as (select * from filtered order by created_at desc,id offset p_offset limit 25)
 select (select count(*) from filtered),coalesce((select jsonb_agg(to_jsonb(paged) order by created_at desc,id) from paged),'[]'::jsonb)
 into total_rows,rows_json;
 return jsonb_build_object('sale_id',s.id,'slug',slug_value,'can_manage',s.status='paid' and coalesce(s.expires_at>now(),false),
  'live',public.ki_guest_live_sale(slug_value) is not null,
  'platform_enabled',coalesce((select enabled from public.ki_guest_platform where id=1),false),
  'settings',jsonb_build_object('revision',coalesce(cfg.revision,0),'accepting',coalesce(cfg.accepting,false),'show_wishes',coalesce(cfg.show_wishes,false)),
  'stats',stats_json,'rows',rows_json,'total',total_rows,'offset',p_offset);
end $$;
revoke all on function public.ki_guest_workspace(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.ki_guest_workspace(uuid,text,text,integer) to authenticated;

create or replace function public.ki_guest_manage(p_sale uuid,p_action text,p_guest uuid,p_revision integer,p_request uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); s public.ki_sales; g public.ki_guests; cfg public.ki_guest_settings; r public.ki_rsvps;
 prior public.ki_guest_mutations; payload jsonb; result jsonb; item jsonb; count_new integer; new_rev integer; emergency boolean:=false;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Owner required' using errcode='42501'; end if;
 if p_sale is null or p_request is null or p_revision is null or p_revision<0 or p_action is null
 or p_action not in ('add_many','update','activate','rotate','moderate','settings') or jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid command' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into s from public.ki_sales where id=p_sale and owner_id=actor for update;
 if not found then raise exception 'Owner required' using errcode='42501'; end if;
 payload:=jsonb_build_object('sale',p_sale,'action',p_action,'guest',p_guest,'revision',p_revision,'data',p_data);
 select * into prior from public.ki_guest_mutations where actor_id=actor and request_id=p_request;
 if found then
  if prior.request_payload<>payload then raise exception 'Retry differs' using errcode='P5006'; end if;
  return prior.result;
 end if;
 emergency:=(p_action='activate' and p_data='{"active":false}'::jsonb) or p_action='rotate'
  or (p_action='settings' and p_data='{"accepting":false,"show_wishes":false}'::jsonb)
  or (p_action='moderate' and p_data='{"moderation":"hidden"}'::jsonb);
 if not emergency and (select count(*) from public.ki_guest_mutations where sale_id=p_sale and created_at>now()-interval '1 minute')>=40 then
  raise exception 'Too many management actions' using errcode='P5005'; end if;
 if p_action='add_many' then
  if p_guest is not null or p_revision<>0 or not public.ki_guest_keys(p_data,array['guests']) or jsonb_typeof(p_data->'guests') is distinct from 'array' then raise exception 'Invalid batch' using errcode='22023'; end if;
  if s.status<>'paid' or s.expires_at is null or s.expires_at<=now() then raise exception 'Paid period required' using errcode='P5007'; end if;
  count_new:=jsonb_array_length(p_data->'guests');
  if count_new not between 1 and 25 then raise exception 'Batch limit' using errcode='22023'; end if;
  if (select count(*) from public.ki_guests where sale_id=p_sale)+count_new>500 then raise exception 'Guest limit' using errcode='P5005'; end if;
  for item in select value from jsonb_array_elements(p_data->'guests') loop
   if not public.ki_guest_keys(item,array['id','name','max_people']) or jsonb_typeof(item->'id') is distinct from 'string'
    or jsonb_typeof(item->'name') is distinct from 'string' or not public.ki_guest_valid_text(item->>'name',1,100)
    or (item->>'id') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    or jsonb_typeof(item->'max_people') is distinct from 'number' or (item->>'max_people') !~ '^(10|[1-9])$' then raise exception 'Invalid guest' using errcode='22023'; end if;
   insert into public.ki_guests(id,sale_id,owner_id,name,max_people) values((item->>'id')::uuid,p_sale,actor,trim(item->>'name'),(item->>'max_people')::integer);
  end loop;
  new_rev:=1;
 elsif p_action='settings' then
  if p_guest is not null or not public.ki_guest_keys(p_data,array['accepting','show_wishes'])
   or jsonb_typeof(p_data->'accepting') is distinct from 'boolean' or jsonb_typeof(p_data->'show_wishes') is distinct from 'boolean' then raise exception 'Invalid settings' using errcode='22023'; end if;
  if ((p_data->>'accepting')::boolean or (p_data->>'show_wishes')::boolean) and (s.status<>'paid' or s.expires_at is null or s.expires_at<=now()) then raise exception 'Paid period required' using errcode='P5007'; end if;
  select * into cfg from public.ki_guest_settings where sale_id=p_sale for update;
  if coalesce(cfg.revision,0)<>p_revision then raise exception 'Settings changed' using errcode='P5001'; end if;
  insert into public.ki_guest_settings(sale_id,owner_id,accepting,show_wishes)
   values(p_sale,actor,(p_data->>'accepting')::boolean,(p_data->>'show_wishes')::boolean)
  on conflict(sale_id) do update set accepting=excluded.accepting,show_wishes=excluded.show_wishes,revision=public.ki_guest_settings.revision+1,updated_at=now()
  returning revision into new_rev;
 else
  if p_guest is null or p_revision<1 then raise exception 'Guest required' using errcode='22023'; end if;
  select * into g from public.ki_guests where id=p_guest and sale_id=p_sale and owner_id=actor for update;
  if not found then raise exception 'Guest not found' using errcode='P5003'; end if;
  if p_action='moderate' then
   if not public.ki_guest_keys(p_data,array['moderation']) or (p_data->>'moderation') is null or (p_data->>'moderation') not in ('approved','hidden') then raise exception 'Invalid moderation' using errcode='22023'; end if;
   select * into r from public.ki_rsvps where guest_id=g.id for update;
   if not found or r.revision<>p_revision then raise exception 'Response changed' using errcode='P5001'; end if;
   if p_data->>'moderation'='approved' and (not r.consent or trim(r.message)='' or trim(r.display_name)='') then raise exception 'Consent required' using errcode='22023'; end if;
   update public.ki_rsvps set moderation=p_data->>'moderation',revision=revision+1,updated_at=now() where guest_id=g.id returning revision into new_rev;
  else
   if g.revision<>p_revision then raise exception 'Guest changed' using errcode='P5001'; end if;
   if p_action='update' then
    if not public.ki_guest_keys(p_data,array['name','max_people']) or jsonb_typeof(p_data->'name') is distinct from 'string'
     or not public.ki_guest_valid_text(p_data->>'name',1,100) or jsonb_typeof(p_data->'max_people') is distinct from 'number'
     or (p_data->>'max_people') !~ '^(10|[1-9])$' then raise exception 'Invalid guest data' using errcode='22023'; end if;
    if exists(select 1 from public.ki_rsvps where guest_id=g.id and people>(p_data->>'max_people')::integer) then raise exception 'Capacity below response' using errcode='P5008'; end if;
    update public.ki_guests set name=trim(p_data->>'name'),max_people=(p_data->>'max_people')::integer,revision=revision+1,updated_at=now() where id=g.id returning revision into new_rev;
   elsif p_action='activate' then
    if not public.ki_guest_keys(p_data,array['active']) or jsonb_typeof(p_data->'active') is distinct from 'boolean' then raise exception 'Invalid status' using errcode='22023'; end if;
    if (p_data->>'active')::boolean and (s.status<>'paid' or s.expires_at is null or s.expires_at<=now()) then raise exception 'Paid period required' using errcode='P5007'; end if;
    update public.ki_guests set active=(p_data->>'active')::boolean,revision=revision+1,updated_at=now() where id=g.id returning revision into new_rev;
   elsif p_action='rotate' then
    if not public.ki_guest_keys(p_data,array[]::text[]) then raise exception 'Invalid rotation' using errcode='22023'; end if;
    update public.ki_guests set token=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),revision=revision+1,updated_at=now() where id=g.id returning revision into new_rev;
   end if;
  end if;
 end if;
 result:=jsonb_build_object('sale_id',p_sale,'action',p_action,'request_id',p_request,'revision',new_rev);
 insert into public.ki_guest_mutations(sale_id,actor_id,request_id,request_payload,result) values(p_sale,actor,p_request,payload,result);
 -- Bound retry log size. Stale versions/unique guest IDs reject replays after retention.
 delete from public.ki_guest_mutations where sale_id=p_sale and id in (
  select id from public.ki_guest_mutations where sale_id=p_sale order by id desc offset 512
 );
 return result;
end $$;
revoke all on function public.ki_guest_manage(uuid,text,uuid,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ki_guest_manage(uuid,text,uuid,integer,uuid,jsonb) to authenticated;

-- Token deliberately absent from all list/export/public responses. Reveal on explicit owner action only.
create or replace function public.ki_guest_link(p_sale uuid,p_guest uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare g public.ki_guests; address text;
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() or not exists(select 1 from public.ki_sales where id=p_sale and owner_id=auth.uid()) then raise exception 'Owner required' using errcode='42501'; end if;
 select * into g from public.ki_guests where id=p_guest and sale_id=p_sale and owner_id=auth.uid() and active;
 if not found then raise exception 'Guest not found' using errcode='P5003'; end if;
 select slug into address from public.ki_publications where sale_id=p_sale;
 if public.ki_guest_live_sale(address) is null then raise exception 'Not available' using errcode='P5002'; end if;
 return jsonb_build_object('id',g.id,'name',g.name,'slug',address,'token',g.token);
end $$;
revoke all on function public.ki_guest_link(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ki_guest_link(uuid,uuid) to authenticated;

create or replace function public.ki_guest_export(p_sale uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() or not exists(select 1 from public.ki_sales where id=p_sale and owner_id=auth.uid()) then raise exception 'Owner required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'max_people',g.max_people,'active',g.active,'revision',g.revision,'created_at',g.created_at,'response',public.ki_guest_response(r)) order by g.created_at,g.id)
  from public.ki_guests g left join public.ki_rsvps r on r.guest_id=g.id where g.sale_id=p_sale),'[]'::jsonb);
end $$;
revoke all on function public.ki_guest_export(uuid) from public,anon,authenticated;
grant execute on function public.ki_guest_export(uuid) to authenticated;

create or replace function public.ki_guest_context(p_slug text,p_token text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare sid uuid; g public.ki_guests; r public.ki_rsvps;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_slug is null or char_length(p_slug) not between 5 and 64 then return null; end if;
 sid:=public.ki_guest_live_sale(p_slug);if sid is null then return null; end if;
 select * into g from public.ki_guests where sale_id=sid and token=p_token and active;
 if not found then return null; end if;
 select * into r from public.ki_rsvps where guest_id=g.id;
 return jsonb_build_object('name',g.name,'max_people',g.max_people,'accepting',coalesce((select accepting from public.ki_guest_settings where sale_id=sid),false),'response',public.ki_guest_response(r));
end $$;
revoke all on function public.ki_guest_context(text,text) from public,anon,authenticated;
grant execute on function public.ki_guest_context(text,text) to anon,authenticated;

create or replace function public.ki_submit_rsvp(p_slug text,p_token text,p_revision integer,p_request uuid,p_attendance text,p_people integer,p_message text,p_display_name text,p_consent boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid; g public.ki_guests; r public.ki_rsvps; payload jsonb; result jsonb; current_revision integer; accepting_now boolean; withdrawal boolean:=false;
begin
 if p_slug is null or char_length(p_slug) not between 5 and 64 or p_token is null or p_token !~ '^[a-f0-9]{64}$'
  or p_revision is null or p_revision<0 or p_request is null or p_attendance is null or p_attendance not in ('yes','no','maybe')
  or p_people is null or p_people not between 0 and 10 or not public.ki_guest_valid_text(p_message,0,500) or not public.ki_guest_valid_text(p_display_name,0,80) or p_consent is null
  or (p_attendance='yes' and p_people<1) or (p_attendance<>'yes' and p_people<>0)
  or (p_consent and (trim(p_message)='' or trim(p_display_name)='')) or (not p_consent and p_display_name<>'') then raise exception 'Invalid response' using errcode='22023'; end if;
 -- Lock gates in a consistent order. Takedown/global shutdown cannot race an accepted write.
 perform 1 from public.ki_commerce_settings where id=1 and publishing_enabled for share;
 if not found then raise exception 'Closed' using errcode='P5002'; end if;
 perform 1 from public.ki_guest_platform where id=1 and enabled for share;
 if not found then raise exception 'Closed' using errcode='P5002'; end if;
 select sale_id into sid from public.ki_publications where slug=p_slug;
 if sid is null then raise exception 'Unavailable' using errcode='P5003'; end if;
 perform 1 from public.ki_sales where id=sid and status='paid' and expires_at>clock_timestamp() for share;
 if not found then raise exception 'Closed' using errcode='P5002'; end if;
 perform 1 from public.ki_publications where sale_id=sid and slug=p_slug and active for share;
 if not found then raise exception 'Closed' using errcode='P5002'; end if;
 select accepting into accepting_now from public.ki_guest_settings where sale_id=sid for share;
 if not found then raise exception 'Closed' using errcode='P5002'; end if;
 select * into g from public.ki_guests where sale_id=sid and token=p_token and active for update;
 if not found then raise exception 'Unavailable' using errcode='P5003'; end if;
 if p_people>g.max_people then raise exception 'Capacity exceeded' using errcode='22023'; end if;
 select * into r from public.ki_rsvps where guest_id=g.id for update;
 payload:=jsonb_build_object('revision',p_revision,'attendance',p_attendance,'people',p_people,'message',trim(p_message),'display_name',trim(p_display_name),'consent',p_consent);
 if r.last_request=p_request then
  if r.last_payload<>payload then raise exception 'Retry differs' using errcode='P5006'; end if;
  return r.last_result;
 end if;
 current_revision:=coalesce(r.revision,0);
 if current_revision<>p_revision then raise exception 'Response changed' using errcode='P5001'; end if;
 withdrawal:=current_revision>0 and r.consent and not p_consent and r.attendance=p_attendance and r.people=p_people and r.message=trim(p_message);
 if not accepting_now and not withdrawal then raise exception 'Closed' using errcode='P5002'; end if;
 if not withdrawal and current_revision>0 and (r.submitted_at>now()-interval '30 seconds' or (r.rate_window>now()-interval '24 hours' and r.rate_count>=20)) then raise exception 'Rate limited' using errcode='P5004'; end if;
 if current_revision=0 then
  insert into public.ki_rsvps(guest_id,attendance,people,message,display_name,consent,moderation,last_request,last_payload)
   values(g.id,p_attendance,p_people,trim(p_message),trim(p_display_name),p_consent,case when p_consent then 'pending' else 'hidden' end,p_request,payload) returning * into r;
 else
  update public.ki_rsvps set attendance=p_attendance,people=p_people,message=trim(p_message),display_name=trim(p_display_name),consent=p_consent,
   moderation=case when p_consent then 'pending' else 'hidden' end,revision=revision+1,updated_at=now(),submitted_at=case when withdrawal then submitted_at else now() end,
   rate_count=case when withdrawal then rate_count when rate_window<=now()-interval '24 hours' then 1 else rate_count+1 end,
   rate_window=case when withdrawal then rate_window when rate_window<=now()-interval '24 hours' then now() else rate_window end,last_request=p_request,last_payload=payload
  where guest_id=g.id returning * into r;
 end if;
 result:=jsonb_build_object('request_id',p_request,'response',public.ki_guest_response(r));
 update public.ki_rsvps set last_result=result where guest_id=g.id;
 return result;
end $$;
revoke all on function public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean) from public,anon,authenticated;
grant execute on function public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean) to anon,authenticated;

create or replace function public.ki_public_wishes(p_slug text,p_before bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare sid uuid; items jsonb; next_value text;
begin
 if p_slug is null or char_length(p_slug) not between 5 and 64 or (p_before is not null and p_before<1) then raise exception 'Invalid page' using errcode='22023'; end if;
 sid:=public.ki_guest_live_sale(p_slug);
 if sid is null or not exists(select 1 from public.ki_guest_settings where sale_id=sid and show_wishes) then return jsonb_build_object('enabled',false,'items','[]'::jsonb,'next',null); end if;
 with visible as (
  select r.public_id,r.display_name,r.message,r.updated_at from public.ki_rsvps r join public.ki_guests g on g.id=r.guest_id
  where g.sale_id=sid and g.active and r.consent and r.moderation='approved' and trim(r.message)<>'' and (p_before is null or r.public_id<p_before)
  order by r.public_id desc limit 21
 ), page_rows as (select * from visible order by public_id desc limit 20)
 select coalesce((select jsonb_agg(jsonb_build_object('id',public_id::text,'name',display_name,'message',message,'updated_at',updated_at) order by public_id desc) from page_rows),'[]'::jsonb),
  case when (select count(*) from visible)>20 then (select min(public_id)::text from page_rows) else null end into items,next_value;
 return jsonb_build_object('enabled',true,'items',items,'next',next_value);
end $$;
revoke all on function public.ki_public_wishes(text,bigint) from public,anon,authenticated;
grant execute on function public.ki_public_wishes(text,bigint) to anon,authenticated;

create or replace function public.ki_guest_platform_read() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 return (select jsonb_build_object('enabled',enabled,'revision',revision) from public.ki_guest_platform where id=1);
end $$;
revoke all on function public.ki_guest_platform_read() from public,anon,authenticated;
grant execute on function public.ki_guest_platform_read() to authenticated;

create or replace function public.ki_guest_platform_update(p_revision integer,p_enabled boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg public.ki_guest_platform;
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_revision is null or p_revision<1 or p_enabled is null then raise exception 'Invalid settings' using errcode='22023'; end if;
 select * into cfg from public.ki_guest_platform where id=1 for update;
 if cfg.revision<>p_revision then
  if cfg.revision=p_revision+1 and cfg.enabled=p_enabled then return jsonb_build_object('enabled',cfg.enabled,'revision',cfg.revision); end if;
  raise exception 'Settings changed' using errcode='P5001';
 end if;
 update public.ki_guest_platform set enabled=p_enabled,revision=revision+1,updated_at=now() where id=1 returning * into cfg;
 return jsonb_build_object('enabled',cfg.enabled,'revision',cfg.revision);
end $$;
revoke all on function public.ki_guest_platform_update(integer,boolean) from public,anon,authenticated;
grant execute on function public.ki_guest_platform_update(integer,boolean) to authenticated;

create or replace function public.ki_system_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare rls_rows jsonb; storage_extra integer; application_extra integer;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('table',expected.name,'enabled',coalesce(c.relrowsecurity,false)) order by expected.name)
 into rls_rows
 from unnest(array['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations']) as expected(name)
 left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=expected.name and c.relkind='r';
 select count(*) into storage_extra from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('ki_media_owner_insert','ki_media_owner_select');
 select count(*) into application_extra from pg_policies where schemaname='public' and tablename in ('ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations')
 and policyname not in ('ki_settings_public_read','ki_templates_public_read','ki_drafts_owner_read','ki_orders_owner_or_admin_read','ki_events_admin_read','ki_commerce_read','ki_sales_read','ki_publications_read','ki_sale_events_read');
 return jsonb_build_object(
  'schema_version',5,'tables_rls',rls_rows,
  'storage_private',exists(select 1 from storage.buckets where id='ki-media' and public=false),
  'storage_limit_ok',exists(select 1 from storage.buckets where id='ki-media' and file_size_limit>0 and file_size_limit<=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp'] and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']),
  'storage_owner_policies_present',(select count(*)=2 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('ki_media_owner_insert','ki_media_owner_select')),
  'storage_extra_policies',storage_extra,'application_extra_policies',application_extra,
  'admin_grants_restricted',not(has_table_privilege('authenticated','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'draft_direct_writes_restricted',not(has_table_privilege('authenticated','public.ki_invitations','INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_invitations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'commerce_direct_writes_restricted',not exists(select 1 from unnest(array['ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'public_photo_rpc_private',not(has_function_privilege('anon','public.ki_public_photo(text,integer,integer)','EXECUTE') or has_function_privilege('authenticated','public.ki_public_photo(text,integer,integer)','EXECUTE')),
  'checkout_enabled',coalesce((select checkout_enabled from public.ki_commerce_settings where id=1),false),
  'publishing_enabled',coalesce((select publishing_enabled from public.ki_commerce_settings where id=1),false),
  'guest_direct_access_restricted',not exists(select 1 from unnest(array['ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'rsvp_enabled',coalesce((select enabled from public.ki_guest_platform where id=1),false),
  'order_requests_enabled',coalesce((select accept_order_requests from public.ki_settings where id=1),false)
 );
end $$;
revoke all on function public.ki_system_status() from public,anon,authenticated;
grant execute on function public.ki_system_status() to authenticated;



create or replace function public.ki_schema_version() returns integer
language sql stable security invoker set search_path='' as $$ select 5; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst, 'reload schema';
commit;

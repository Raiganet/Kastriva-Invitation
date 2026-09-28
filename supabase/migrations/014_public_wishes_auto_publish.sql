-- Auto-publish consented public wishes and use friendlier defaults.
-- Apply manually in Supabase SQL Editor after migration 013.

alter table if exists public.ki_open_wish_settings
  alter column accepting set default true,
  alter column showing set default true;

create or replace function public.ki_open_wish_submit(p_slug text,p_id uuid,p_receipt text,p_name text,p_message text,p_consent boolean,p_network text) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='3s' as $$
declare sid uuid; receipt_digest text; body_digest text; old public.ki_open_wishes; budget public.ki_open_wish_network;
 t timestamptz:=clock_timestamp();
begin
 if p_id is null or p_receipt is null or p_receipt !~ '^[a-f0-9]{64}$' or p_network is null or p_network !~ '^[a-f0-9]{64}$'
 or not public.ki_guest_valid_text(p_name,1,80) or not public.ki_guest_valid_text(p_message,1,500) or p_consent is null then
  raise exception 'Invalid wish' using errcode='22023';end if;
 select sale_id into sid from public.ki_publications where slug=p_slug;
 if sid is null then raise exception 'Unavailable' using errcode='P1302';end if;
 perform 1 from public.ki_sales where id=sid for update;
 t:=clock_timestamp();
 receipt_digest:=encode(sha256(convert_to(p_receipt,'UTF8')),'hex');
 body_digest:=encode(sha256(convert_to(jsonb_build_object('slug',p_slug,'name',p_name,'message',p_message,'consent',p_consent)::text,'UTF8')),'hex');
 select * into old from public.ki_open_wishes where id=p_id;
 if found then
  if old.sale_id<>sid or old.receipt_hash<>receipt_digest or old.input_hash<>body_digest then raise exception 'Request conflict' using errcode='P1306';end if;
  return jsonb_build_object('id',p_id,'received',true);
 end if;
 if public.ki_open_wish_live_sale(p_slug) is distinct from sid
 or not coalesce((select enabled from public.ki_open_wish_platform where id=1),false)
 or not coalesce((select accepting from public.ki_open_wish_settings where sale_id=sid),true) then
  raise exception 'Closed' using errcode='P1302';end if;
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
 values(p_id,sid,p_name,p_message,p_consent,case when p_consent then 'approved' else 'hidden' end,receipt_digest,body_digest);
 return jsonb_build_object('id',p_id,'received',true);
end $$;

create or replace function public.ki_open_wish_feed(p_slug text,p_before bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare sid uuid; cfg public.ki_open_wish_settings; enabled boolean; items jsonb; next_id text;
begin
 if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) not between 5 and 64 or (p_before is not null and p_before<1) then raise exception 'Invalid query' using errcode='22023';end if;
 sid:=public.ki_open_wish_live_sale(p_slug);
 select * into cfg from public.ki_open_wish_settings where sale_id=sid;
 enabled:=sid is not null and coalesce((select p.enabled from public.ki_open_wish_platform p where id=1),false);
 items:='[]'::jsonb;
 if enabled and coalesce(cfg.showing,true) then
  select coalesce(jsonb_agg(jsonb_build_object('id',w.sequence::text,'name',w.name,'message',w.message,'updated_at',w.created_at) order by w.sequence desc),'[]'::jsonb)
  into items from (select * from public.ki_open_wishes where sale_id=sid and consent and moderation='approved' and not removed
   and (p_before is null or sequence<p_before) order by sequence desc limit 20) w;
  if jsonb_array_length(items)=20 then next_id:=items->19->>'id';end if;
 end if;
 return jsonb_build_object('accepting',enabled and coalesce(cfg.accepting,true),
 'showing',enabled and coalesce(cfg.showing,true),'items',items,'next',next_id);
end $$;

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
 'settings',jsonb_build_object('revision',coalesce(cfg.revision,0),'accepting',coalesce(cfg.accepting,true),'showing',coalesce(cfg.showing,true)),
 'stats',stats,'rows',rows_json,'total',total,'offset',p_offset);
end $$;

update public.ki_open_wishes
set moderation='approved', revision=revision+1
where consent=true and moderation='pending' and removed=false;

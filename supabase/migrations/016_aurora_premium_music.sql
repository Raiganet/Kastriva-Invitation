-- Premium Aurora renderer + expanded built-in music library. Additive upgrade after 015.
-- Keeps base schema capability 7 and preserves existing orders/publications/customer content.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
do $$ begin
 if public.ki_schema_version()<>7 or to_regprocedure('public.ki_open_wish_auto_publish_version()') is null then raise exception 'Requires migrations through 015'; end if;
 if jsonb_array_length(public.ki_cms_catalog()) not in (15,16) then raise exception 'Expected current 15-theme catalog before Aurora upgrade'; end if;
 perform id from public.ki_cms where id=1 for update;
end $$;

create or replace function public.ki_valid_content(p_content jsonb,p_owner uuid) returns boolean
language plpgsql immutable set search_path=''
as $$
declare base jsonb; events jsonb; event jsonb; projected jsonb; field text; gift jsonb;
 allowed text[]:=array['id','label','eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 event_fields text[]:=array['eventDate','eventTime','endTime','timezone','venue','address','mapUrl'];
 ids text[]:=array[]::text[];
begin
 if p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>32768 then return false; end if;
 if p_content ? 'music' and (jsonb_typeof(p_content->'music') is distinct from 'string' or p_content->>'music' not in ('none','serenade','starlight','moonlight','ever-after','ocean-vows','sakura-promise','celestial-waltz','cinematic-bloom')) then return false; end if;
 if p_content ? 'gifts' then
  if jsonb_typeof(p_content->'gifts') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_content->'gifts')>3 then return false; end if;
  for gift in select value from jsonb_array_elements(p_content->'gifts') loop
   if jsonb_typeof(gift) is distinct from 'object' then return false; end if;
   if not(gift ?& array['bank','account','holder']) or exists(select 1 from jsonb_object_keys(gift) as keys(key) where key not in ('bank','account','holder')) then return false; end if;
   if jsonb_typeof(gift->'bank') is distinct from 'string' or char_length(gift->>'bank')>60
    or jsonb_typeof(gift->'holder') is distinct from 'string' or char_length(gift->>'holder')>100
    or jsonb_typeof(gift->'account') is distinct from 'string' or (gift->>'account') !~ '^[0-9]{0,30}$' then return false; end if;
   if (gift->>'bank') ~ '[[:cntrl:]]' or (gift->>'holder') ~ '[[:cntrl:]]' then return false; end if;
  end loop;
 end if;
 base:=p_content-'events'-'music'-'gifts';
 if not public.ki_valid_base_content(base,p_owner) then return false; end if;
 if (select count(*) from jsonb_array_elements(base->'photoPaths')) <>
    (select count(distinct value) from jsonb_array_elements(base->'photoPaths')) then return false; end if;
 -- Old drafts remain valid; migration does not force-write or delete their contents.
 if not (p_content ? 'events') then return true; end if;
 events:=p_content->'events';
 if jsonb_typeof(events)<>'array' then return false; end if;
 if jsonb_array_length(events)<1 or jsonb_array_length(events)>3 then return false; end if;
 for event in select value from jsonb_array_elements(events) loop
  if jsonb_typeof(event)<>'object' then return false; end if;
  if not (event ?& allowed) or exists(select 1 from jsonb_object_keys(event) as keys(key) where not(key=any(allowed))) then return false; end if;
  if jsonb_typeof(event->'id')<>'string' or (event->>'id') !~ '^[a-z0-9-]{1,64}$' or (event->>'id')=any(ids) then return false; end if;
  ids:=array_append(ids,event->>'id');
  if jsonb_typeof(event->'label')<>'string' or char_length(event->>'label')>80 then return false; end if;
  projected:=base;
  foreach field in array event_fields loop projected:=jsonb_set(projected,array[field],event->field); end loop;
  if not public.ki_valid_base_content(projected,p_owner) then return false; end if;
 end loop;
 -- Existing dashboard/order readers must see the exact first event, not contradictory fields.
 foreach field in array event_fields loop
  if base->field is distinct from (events->0)->field then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;

create or replace function public.ki_cms_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'price',price,'active',active) order by sort_order,slug),'[]'::jsonb)
 from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern']);
$$;

create or replace function public.ki_cms_valid_document(d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; item jsonb; f record; k text; seen text[]:='{}';
begin
 if not public.ki_guest_keys(d,array['version','content','catalog']) or d->'version'<>'1'::jsonb or octet_length(d::text)>30000 then return false; end if;
 c:=d->'content';
 if not public.ki_guest_keys(c,array['brandName','tagline','heroEyebrow','heroTitle','heroAccent','heroBody','heroPrimary','heroSecondary','aboutTitle','aboutBody','featuresTitle','collectionTitle','collectionBody','stepsTitle','faqTitle','ctaTitle','ctaBody','ctaLabel','footerText','contactEmail','whatsapp','companyUrl','seoTitle','seoDescription','features','steps','faqs','allowIndex']) then return false; end if;
 for f in select * from (values ('brandName',1,40),('tagline',1,40),('heroEyebrow',1,80),('heroTitle',1,160),('heroAccent',1,100),('heroBody',1,700),('heroPrimary',1,50),('heroSecondary',1,50),('aboutTitle',1,150),('aboutBody',1,1200),('featuresTitle',1,150),('collectionTitle',1,150),('collectionBody',1,500),('stepsTitle',1,150),('faqTitle',1,150),('ctaTitle',1,160),('ctaBody',1,500),('ctaLabel',1,50),('footerText',1,600),('contactEmail',0,120),('whatsapp',0,15),('companyUrl',1,200),('seoTitle',10,70),('seoDescription',20,180)) as limits(k,lo,hi) loop
  if jsonb_typeof(c->f.k)<>'string' or not public.ki_cms_text(c->>f.k,f.lo,f.hi) then return false; end if;
 end loop;
 if c->>'contactEmail'<>'' and (c->>'contactEmail') !~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$' then return false; end if;
 if c->>'whatsapp'<>'' and (c->>'whatsapp') !~ '^62[0-9]{8,13}$' then return false; end if;
 if (c->>'companyUrl') !~ '^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}/?$' or strpos(c->>'companyUrl','..')>0 then return false; end if;
 if jsonb_typeof(c->'allowIndex')<>'boolean' then return false; end if;
 foreach k in array array['features','steps'] loop
  if jsonb_typeof(c->k)<>'array' or jsonb_array_length(c->k) not between 1 and 6 or (k='steps' and jsonb_array_length(c->k)<>3) then return false; end if;
  for item in select value from jsonb_array_elements(c->k) loop
   if not public.ki_guest_keys(item,array['title','body']) or jsonb_typeof(item->'title')<>'string' or jsonb_typeof(item->'body')<>'string' or not public.ki_cms_text(item->>'title',1,90) or not public.ki_cms_text(item->>'body',1,500) then return false; end if;
  end loop;
 end loop;
 if jsonb_typeof(c->'faqs')<>'array' or jsonb_array_length(c->'faqs') not between 1 and 8 then return false; end if;
 for item in select value from jsonb_array_elements(c->'faqs') loop
  if not public.ki_guest_keys(item,array['question','answer']) or jsonb_typeof(item->'question')<>'string' or jsonb_typeof(item->'answer')<>'string' or not public.ki_cms_text(item->>'question',1,160) or not public.ki_cms_text(item->>'answer',1,800) then return false; end if;
 end loop;
 if jsonb_typeof(d->'catalog')<>'array' or jsonb_array_length(d->'catalog') not in (8,13,14,15,16) then return false; end if;
 for item in select value from jsonb_array_elements(d->'catalog') loop
  if not public.ki_guest_keys(item,array['slug','name','description','price','active']) then return false; end if;
  if jsonb_typeof(item->'slug')<>'string' or not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern'])) or (item->>'slug')=any(seen) then return false; end if;
  if jsonb_array_length(d->'catalog')=8 and not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event'])) then return false; end if;
  if jsonb_array_length(d->'catalog')=13 and not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'])) then return false; end if;
  if jsonb_array_length(d->'catalog')=14 and not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1'])) then return false; end if;
  if jsonb_array_length(d->'catalog')=15 and not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush'])) then return false; end if;
  seen:=array_append(seen,item->>'slug');
  if jsonb_typeof(item->'name')<>'string' or jsonb_typeof(item->'description')<>'string' or not public.ki_cms_text(item->>'name',1,80) or not public.ki_cms_text(item->>'description',1,500) then return false; end if;
  if jsonb_typeof(item->'active')<>'boolean' or jsonb_typeof(item->'price')<>'number' or (item->>'price')::numeric<>trunc((item->>'price')::numeric) or (item->>'price')::numeric not between 1000 and 100000000 then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;

create or replace function public.ki_cms_mutate(p_action text,p_revision integer,p_request uuid,p_catalog_hash text,p_document jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); c public.ki_cms; prior public.ki_cms_events; payload jsonb; result jsonb; item jsonb; pos integer:=0; live_catalog jsonb;
begin
 if actor is null or not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_action is null or p_action not in ('save','publish') or p_revision is null or p_revision<1 or p_revision>=2147483646 or p_request is null or p_catalog_hash is null or p_catalog_hash !~ '^[a-f0-9]{32}$' then raise exception 'Invalid CMS command' using errcode='22023'; end if;
 if (p_action='save' and not public.ki_cms_valid_document(p_document)) or (p_action='publish' and p_document is not null) then raise exception 'Invalid CMS document' using errcode='22023'; end if;
 select * into strict c from public.ki_cms where id=1 for update;
 payload:=jsonb_build_object('action',p_action,'revision',p_revision,'catalog_hash',p_catalog_hash,'document',p_document);
 select * into prior from public.ki_cms_events where actor_id=actor and request_id=p_request;
 if found then
  if prior.payload<>payload then raise exception 'Retry differs' using errcode='P6002'; end if;
  return prior.result;
 end if;
 if c.revision<>p_revision then raise exception 'CMS changed' using errcode='P6001'; end if;
 if (select count(*) from public.ki_cms_events where actor_id=actor and created_at>now()-interval '1 minute')>=30 then raise exception 'CMS rate limit' using errcode='P0001'; end if;
  -- Same lock order for all catalog publishes; checkout holds SHARE locks on these rows.
  perform slug from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern']) order by slug for update;
  live_catalog:=public.ki_cms_catalog();
  if md5(live_catalog::text)<>p_catalog_hash then raise exception 'Catalog changed outside CMS' using errcode='P6003'; end if;
 if jsonb_array_length((case when p_action='save' then p_document else c.draft end)->'catalog')<>jsonb_array_length(live_catalog) then raise exception 'Reload the current catalog before saving' using errcode='22023'; end if;
 if p_action='save' then
  update public.ki_cms set draft=p_document,revision=revision+1,updated_at=now() where id=1 returning * into c;
 else
  for item in select value from jsonb_array_elements(c.draft->'catalog') loop
   update public.ki_templates set name=item->>'name',description=item->>'description',price=(item->>'price')::integer,active=(item->>'active')::boolean,sort_order=pos where slug=item->>'slug';
   if not found then raise exception 'Unknown template' using errcode='22023'; end if;
   pos:=pos+1;
  end loop;
  -- No update to ki_sales, ki_publications, ki_guest_* or feature gates.
  update public.ki_cms set published=draft,revision=revision+1,published_revision=revision+1,updated_at=now(),published_at=now() where id=1 returning * into c;
  insert into public.ki_cms_history(revision,document,actor_id,published_at) values(c.published_revision,c.published,actor,c.published_at);
 end if;
 result:=jsonb_build_object('action',p_action,'request_id',p_request,'revision',c.revision,'published_revision',c.published_revision);
 insert into public.ki_cms_events(actor_id,request_id,payload,result) values(actor,p_request,payload,result);
 return result;
end $$;

insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order)
values ('aurora-modern','Aurora Luxe Motion','pernikahan','Tema premium modern dengan glassmorphism, aurora berlapis, orbit cahaya, partikel sinematik, transisi halus, dan koleksi musik instrumental.',250000,'🌌','["#080B16","#8B5CF6","#22D3EE"]'::jsonb,'["Sampul glassmorphism premium","Animasi aurora, orbit & partikel","8 pilihan musik instrumental","Motion section & micro-interaction","Amplop digital","Lokasi per acara","Preview sebelum pesan"]'::jsonb,true,15)
on conflict(slug) do nothing;

do $$
declare c public.ki_cms; item jsonb; catalog jsonb; next_draft jsonb; next_published jsonb;
begin
 select * into strict c from public.ki_cms where id=1 for update;
 catalog:=public.ki_cms_catalog();next_draft:=c.draft;next_published:=c.published;
 select value into item from jsonb_array_elements(catalog) where value->>'slug'='aurora-modern';
 if item is null then raise exception 'Aurora catalog row missing';end if;
 if not exists(select 1 from jsonb_array_elements(next_draft->'catalog') r where r->>'slug'='aurora-modern') then next_draft:=jsonb_set(next_draft,'{catalog}',(next_draft->'catalog')||jsonb_build_array(item));end if;
 if not exists(select 1 from jsonb_array_elements(next_published->'catalog') r where r->>'slug'='aurora-modern') then next_published:=jsonb_set(next_published,'{catalog}',(next_published->'catalog')||jsonb_build_array(item));end if;
 if next_draft is distinct from c.draft or next_published is distinct from c.published then
  update public.ki_cms set draft=next_draft,published=next_published,revision=revision+1,published_revision=revision+1,updated_at=now(),published_at=now() where id=1 returning * into c;
  insert into public.ki_cms_history(revision,document,actor_id,published_at) values(c.published_revision,c.published,null,c.published_at);
 end if;
 if not public.ki_cms_valid_document(c.draft) or not public.ki_cms_valid_document(c.published) or jsonb_array_length(c.draft->'catalog')<>16 or jsonb_array_length(c.published->'catalog')<>16 then raise exception 'Aurora catalog validation failed';end if;
 if exists(select 1 from public.ki_cms_history where not public.ki_cms_valid_document(document)) then raise exception 'History compatibility failed';end if;
end $$;

create or replace function public.ki_feature_readiness() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 base jsonb := '{"groom":"Contoh","bride":"Contoh","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Lokasi pengujian sintetis","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 probe_owner uuid := '00000000-0000-4000-8000-000000000001';
 extended jsonb; catalog jsonb := '[]'::jsonb; c public.ki_cms;
 known text[] := array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern'];
 heritage text[] := array['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'];
 found_slugs text[] := array[]::text[]; catalog_slugs text[] := array[]::text[];
 legacy_ok boolean := false; extras_ok boolean := false; cms_ok boolean := false;
 heritage_ok boolean := false; luxury_ok boolean := false; botanical_ok boolean := false; aurora_ok boolean := false;
 known_count integer := 0;
begin
 -- No customer row is used. These probes cannot write because this function is STABLE.
 begin
  legacy_ok := public.ki_valid_content(base,probe_owner) is true
    and public.ki_publishable_content(base,probe_owner) is true;
  extended := base || '{"music":"serenade","gifts":[{"bank":"Contoh","account":"0012345678","holder":"Contoh"}]}'::jsonb;
  extras_ok := legacy_ok
    and public.ki_valid_content(extended,probe_owner) is true
    and public.ki_publishable_content(extended,probe_owner) is true
    and public.ki_valid_content(base || '{"music":"https://invalid.example/audio.mp3"}'::jsonb,probe_owner) is false
    and public.ki_valid_content(base || '{"gifts":null}'::jsonb,probe_owner) is false
    and public.ki_valid_content(extended || jsonb_build_object('gifts',(extended->'gifts')||(extended->'gifts')||(extended->'gifts')||(extended->'gifts')),probe_owner) is false
    and public.ki_valid_content(extended || '{"unknown_field":true}'::jsonb,probe_owner) is false
    and public.ki_publishable_content(base || '{"gifts":[{"bank":"","account":"","holder":""}]}'::jsonb,probe_owner) is false;
 exception when others then
  legacy_ok := false; extras_ok := false;
 end;
 begin
  -- Availability is a business choice: active=false still counts as an installed identity.
  select coalesce(array_agg(slug order by slug),array[]::text[]),count(*)::integer
   into found_slugs,known_count from public.ki_templates where slug=any(known);
  catalog := public.ki_cms_catalog();
  if jsonb_typeof(catalog)='array' then
   select coalesce(array_agg(value->>'slug'),array[]::text[]) into catalog_slugs
    from jsonb_array_elements(catalog);
  end if;
  heritage_ok := heritage <@ found_slugs and heritage <@ catalog_slugs
    and (select count(*) from public.ki_templates where slug=any(heritage) and category='pernikahan')=5;
  luxury_ok := 'elementor-luxury-1'=any(found_slugs) and 'elementor-luxury-1'=any(catalog_slugs)
    and exists(select 1 from public.ki_templates where slug='elementor-luxury-1' and category='pernikahan');
  botanical_ok := 'botanical-blush'=any(found_slugs) and 'botanical-blush'=any(catalog_slugs)
    and exists(select 1 from public.ki_templates where slug='botanical-blush' and category='pernikahan');
  select * into c from public.ki_cms where id=1;
  cms_ok := found and known_count=16 and cardinality(catalog_slugs)=16
    and known <@ catalog_slugs and catalog_slugs <@ known
    and public.ki_cms_valid_document(c.draft) is true
    and public.ki_cms_valid_document(c.published) is true
    and jsonb_array_length(c.draft->'catalog')=16
    and jsonb_array_length(c.published->'catalog')=16
    and (select count(*) from public.ki_templates where slug=any(known) and category='pernikahan')=13;
  aurora_ok := 'aurora-modern'=any(found_slugs) and 'aurora-modern'=any(catalog_slugs)
    and exists(select 1 from public.ki_templates where slug='aurora-modern' and category='pernikahan')
    and public.ki_valid_content(base || '{"music":"starlight"}'::jsonb,probe_owner) is true
    and public.ki_valid_content(base || '{"music":"cinematic-bloom"}'::jsonb,probe_owner) is true;
 exception when others then
  cms_ok := false; heritage_ok := false; luxury_ok := false; botanical_ok := false; aurora_ok := false;
 end;
 -- Only the following fixed metadata may leave this function: no draft/CMS text, prices,
 -- hidden theme names, contacts, account IDs, tokens, Storage paths, SQL errors or keys.
 return jsonb_build_object(
  'contract_version',1,'base_schema_version',public.ki_schema_version(),'diagnostics_migration',16,
  'known_templates',known_count,
  'capabilities',jsonb_build_object('legacy_content',legacy_ok,'invitation_extras',extras_ok,
   'heritage_themes',heritage_ok,'luxury_theme',luxury_ok,'botanical_theme',botanical_ok,
   'aurora_premium_music',aurora_ok,'cms_catalog_complete',cms_ok));
end $$;
revoke all on function public.ki_feature_readiness() from public,anon,authenticated,service_role;
grant execute on function public.ki_feature_readiness() to anon,authenticated,service_role;
comment on function public.ki_feature_readiness() is 'Read-only fixed capability metadata extended by migration 016 for Aurora Luxe Motion and built-in music library.';
notify pgrst,'reload schema';
commit;

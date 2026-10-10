-- Signature collection: four additive, purchasable theme identities.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';

do $$ begin
 if public.ki_schema_version()<>7 or jsonb_array_length(public.ki_cms_catalog()) not in (24,28) then raise exception 'Requires premium edition catalog'; end if;
 perform id from public.ki_cms where id=1 for update;
end $$;

insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values
 ('celeste-atelier','Celeste Atelier','pernikahan','Atelier ivory di bawah langit senja, dengan lengkung sapphire, magnolia, dan kilau konstelasi yang anggun.',275000,'✧','["#F4F0EA","#314C6B","#C9A565"]'::jsonb,'["Lengkung celestial & magnolia","Sampul cahaya berlapis","Kartu cerita elegan","Musik waltz & foto demo","Demo ucapan & RSVP"]'::jsonb,true,24),
 ('citrus-reverie','Citrus Reverie','ulang-tahun','Perayaan hangat dengan roset kertas, warna citrus, pita artistik, dan kilau lilin untuk pesta yang penuh tawa.',150000,'◌','["#FFF2DF","#A9523D","#2F7380"]'::jsonb,'["Roset pesta & pita ilustratif","Sampul slide penuh warna","Animasi kartu bertahap","Musik & foto demo","Demo ucapan & RSVP"]'::jsonb,true,25),
 ('safiya-orbit','Safiya Orbit','aqiqah','Langit periwinkle, bulan sabit, awan lembut, dan orbit bintang yang menenangkan untuk menyambut buah hati.',150000,'☾','["#EEF1FA","#4D5E91","#BE9D64"]'::jsonb,'["Bulan, awan & orbit bintang","Sampul cahaya lembut","Animasi menenangkan","Musik piano & foto demo","Demo ucapan & RSVP"]'::jsonb,true,26),
 ('atlas-salon','Atlas Salon','acara-kantor','Salon editorial bernuansa espresso dan copper, lengkap dengan kompas, grid arsitektural, dan detail untuk perayaan prestasi.',250000,'✦','["#211A1C","#F3E7DA","#C27954"]'::jsonb,'["Kompas & grid editorial","Sampul slide bertekstur","Kartu agenda premium","Musik & foto demo","Demo ucapan & RSVP"]'::jsonb,true,27)
on conflict(slug) do nothing;

create or replace function public.ki_cms_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'price',price,'active',active) order by sort_order,slug),'[]'::jsonb)
 from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern','velvet-vow','peach-confetti','little-moon','sapphire-summit','seraphine-garden','jubilee-carousel','nur-eden','nocturne-gala','celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']);
$$;

-- Keep every historical backup valid while extending the current CMS generation.
alter function public.ki_cms_valid_document(jsonb) rename to ki_cms_valid_document_v24;
create function public.ki_cms_valid_document(d jsonb) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare filtered jsonb; item jsonb; slugs text[]:=array[]::text[];
begin
 if jsonb_typeof(d)='object' and jsonb_typeof(d->'catalog')='array' and jsonb_array_length(d->'catalog')=28 then
  select coalesce(array_agg(value->>'slug'),array[]::text[]) into slugs from jsonb_array_elements(d->'catalog');
  if cardinality(slugs)<>28 or array(select unnest(slugs) except select unnest(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern','velvet-vow','peach-confetti','little-moon','sapphire-summit','seraphine-garden','jubilee-carousel','nur-eden','nocturne-gala','celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']))<>array[]::text[] or array(select unnest(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern','velvet-vow','peach-confetti','little-moon','sapphire-summit','seraphine-garden','jubilee-carousel','nur-eden','nocturne-gala','celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']) except select unnest(slugs))<>array[]::text[] then return false; end if;
  select jsonb_set(d,'{catalog}',coalesce(jsonb_agg(value),'[]'::jsonb)) into filtered from jsonb_array_elements(d->'catalog') where value->>'slug' not in ('celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon');
  if not public.ki_cms_valid_document_v24(filtered) then return false; end if;
  for item in select value from jsonb_array_elements(d->'catalog') where value->>'slug' in ('celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon') loop
   if not public.ki_guest_keys(item,array['slug','name','description','price','active']) or jsonb_typeof(item->'name')<>'string' or jsonb_typeof(item->'description')<>'string' or not public.ki_cms_text(item->>'name',1,80) or not public.ki_cms_text(item->>'description',1,500) or jsonb_typeof(item->'active')<>'boolean' or jsonb_typeof(item->'price')<>'number' or (item->>'price')::numeric<>trunc((item->>'price')::numeric) or (item->>'price')::numeric not between 1000 and 100000000 then return false; end if;
  end loop;
  return true;
 end if;
 return public.ki_cms_valid_document_v24(d);
exception when others then return false;
end $$;

-- Constraints keep function identities by OID, so rebind them to the 28-theme validator.
alter table public.ki_cms drop constraint ki_cms_draft_check;
alter table public.ki_cms drop constraint ki_cms_published_check;
alter table public.ki_cms add constraint ki_cms_draft_check check(public.ki_cms_valid_document(draft));
alter table public.ki_cms add constraint ki_cms_published_check check(public.ki_cms_valid_document(published));

-- Rebind the CMS command to the extended document validator and lock set.
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
 if found then if prior.payload<>payload then raise exception 'Retry differs' using errcode='P6002'; end if; return prior.result; end if;
 if c.revision<>p_revision then raise exception 'CMS changed' using errcode='P6001'; end if;
 if (select count(*) from public.ki_cms_events where actor_id=actor and created_at>now()-interval '1 minute')>=30 then raise exception 'CMS rate limit' using errcode='P0001'; end if;
 perform slug from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern','velvet-vow','peach-confetti','little-moon','sapphire-summit','seraphine-garden','jubilee-carousel','nur-eden','nocturne-gala','celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']) order by slug for update;
 live_catalog:=public.ki_cms_catalog();
 if md5(live_catalog::text)<>p_catalog_hash then raise exception 'Catalog changed outside CMS' using errcode='P6003'; end if;
 if jsonb_array_length((case when p_action='save' then p_document else c.draft end)->'catalog')<>jsonb_array_length(live_catalog) then raise exception 'Reload the current catalog before saving' using errcode='22023'; end if;
 if p_action='save' then
  update public.ki_cms set draft=p_document,revision=revision+1,updated_at=now() where id=1 returning * into c;
 else
  for item in select value from jsonb_array_elements(c.draft->'catalog') loop
   update public.ki_templates set name=item->>'name',description=item->>'description',price=(item->>'price')::integer,active=(item->>'active')::boolean,sort_order=pos where slug=item->>'slug';
   if not found then raise exception 'Unknown template' using errcode='22023'; end if; pos:=pos+1;
  end loop;
  update public.ki_cms set published=draft,revision=revision+1,published_revision=revision+1,updated_at=now(),published_at=now() where id=1 returning * into c;
  insert into public.ki_cms_history(revision,document,actor_id,published_at) values(c.published_revision,c.published,actor,c.published_at);
 end if;
 result:=jsonb_build_object('action',p_action,'request_id',p_request,'revision',c.revision,'published_revision',c.published_revision);
 insert into public.ki_cms_events(actor_id,request_id,payload,result) values(actor,p_request,payload,result); return result;
end $$;

do $$
declare c public.ki_cms; item jsonb; next_draft jsonb; next_published jsonb;
begin
 select * into strict c from public.ki_cms where id=1 for update; next_draft:=c.draft; next_published:=c.published;
 for item in select value from jsonb_array_elements(public.ki_cms_catalog()) where value->>'slug'=any(array['celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']) loop
  if not exists(select 1 from jsonb_array_elements(next_draft->'catalog') r where r->>'slug'=item->>'slug') then next_draft:=jsonb_set(next_draft,'{catalog}',(next_draft->'catalog')||jsonb_build_array(item)); end if;
  if not exists(select 1 from jsonb_array_elements(next_published->'catalog') r where r->>'slug'=item->>'slug') then next_published:=jsonb_set(next_published,'{catalog}',(next_published->'catalog')||jsonb_build_array(item)); end if;
 end loop;
 if next_draft is distinct from c.draft or next_published is distinct from c.published then
  update public.ki_cms set draft=next_draft,published=next_published,revision=revision+1,published_revision=revision+1,updated_at=now(),published_at=now() where id=1 returning * into c;
  insert into public.ki_cms_history(revision,document,actor_id,published_at) values(c.published_revision,c.published,null,c.published_at);
 end if;
 if not public.ki_cms_valid_document(c.draft) or not public.ki_cms_valid_document(c.published) or jsonb_array_length(c.draft->'catalog')<>28 or jsonb_array_length(c.published->'catalog')<>28 then raise exception 'Signature catalog validation failed'; end if;
 if exists(select 1 from public.ki_cms_history where not public.ki_cms_valid_document(document)) then raise exception 'History compatibility failed'; end if;
end $$;

alter function public.ki_feature_readiness() rename to ki_feature_readiness_v24;
create function public.ki_feature_readiness() returns jsonb
language sql stable security definer set search_path='' as $$
 with prior as (select public.ki_feature_readiness_v24() report), expected as (select array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush','aurora-modern','velvet-vow','peach-confetti','little-moon','sapphire-summit','seraphine-garden','jubilee-carousel','nur-eden','nocturne-gala','celeste-atelier','citrus-reverie','safiya-orbit','atlas-salon']::text[] slugs), current as (select array_agg(slug order by slug) slugs from public.ki_templates where slug=any((select slugs from expected)))
 select jsonb_set(jsonb_set(report,'{known_templates}',to_jsonb(28)),'{capabilities,cms_catalog_complete}',to_jsonb((select slugs from expected)<@(select slugs from current) and (select count(*) from public.ki_templates where slug=any((select slugs from expected)))=28 and jsonb_array_length(public.ki_cms_catalog())=28)) from prior;
$$;
revoke all on function public.ki_feature_readiness() from public;
grant execute on function public.ki_feature_readiness() to anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;

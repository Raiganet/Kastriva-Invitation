-- Five additional wedding renderers. Apply AFTER the compatible application deploy.
-- Keeps schema capability 7, function ACLs, RLS, customer data and existing prices.
begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
do $$ begin
 if to_regprocedure('public.ki_cms_catalog()') is null or public.ki_schema_version()<>7 then raise exception 'Requires migrations 001-008'; end if;
 -- Match the CMS mutation lock order: CMS row first, then catalog rows.
 perform id from public.ki_cms where id=1 for update;
end $$;

create or replace function public.ki_cms_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'price',price,'active',active) order by sort_order,slug),'[]'::jsonb)
 from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali']);
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
 if jsonb_typeof(d->'catalog')<>'array' or jsonb_array_length(d->'catalog') not in (8,13) then return false; end if;
 for item in select value from jsonb_array_elements(d->'catalog') loop
  if not public.ki_guest_keys(item,array['slug','name','description','price','active']) then return false; end if;
  if jsonb_typeof(item->'slug')<>'string' or not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'])) or (item->>'slug')=any(seen) then return false; end if;
  if jsonb_array_length(d->'catalog')=8 and not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event'])) then return false; end if;
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
  perform slug from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali']) order by slug for update;
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

insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values ('islami-sakinah','Islami Sakinah','pernikahan','Lengkung geometris hijau zamrud dan emas, dengan pembuka Bismillah yang teduh.',200000,'☾','["#123D35", "#D6BD7F", "#1B4B40"]'::jsonb,'["Sampul personal", "Musik instrumental opsional", "Amplop digital", "Lokasi per acara", "Preview sebelum pesan"]'::jsonb,true,8) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values ('adat-sunda','Adat Sunda','pernikahan','Nuansa hijau Priangan, sulur daun dan melati putih dalam bingkai yang lembut.',200000,'❀','["#EDF0E4", "#44634C", "#D8C398"]'::jsonb,'["Sampul personal", "Musik instrumental opsional", "Amplop digital", "Lokasi per acara", "Preview sebelum pesan"]'::jsonb,true,9) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values ('adat-minang','Adat Minang','pernikahan','Merah marun dan emas dengan siluet gonjong serta pola geometris terinspirasi songket.',200000,'◈','["#501C26", "#E2BC70", "#682E34"]'::jsonb,'["Sampul personal", "Musik instrumental opsional", "Amplop digital", "Lokasi per acara", "Preview sebelum pesan"]'::jsonb,true,10) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values ('adat-jawa','Adat Jawa','pernikahan','Krem dan cokelat sogan, ornamen terinspirasi kawung, serta siluet pendopo yang anggun.',200000,'◇','["#F2E8D5", "#775237", "#D5BC8E"]'::jsonb,'["Sampul personal", "Musik instrumental opsional", "Amplop digital", "Lokasi per acara", "Preview sebelum pesan"]'::jsonb,true,11) on conflict(slug) do nothing;
insert into public.ki_templates(slug,name,category,description,price,thumbnail,colors,features,active,sort_order) values ('adat-bali','Adat Bali','pernikahan','Terakota hangat dengan siluet gerbang terbelah dan bunga tropis berwarna gading.',200000,'✿','["#F4E3D3", "#8E513A", "#D1A56D"]'::jsonb,'["Sampul personal", "Musik instrumental opsional", "Amplop digital", "Lokasi per acara", "Preview sebelum pesan"]'::jsonb,true,12) on conflict(slug) do nothing;

-- Append only absent new themes. Preserve unpublished copy, existing prices and order.
do $$
declare c public.ki_cms; next_draft jsonb; next_published jsonb; item jsonb; catalog jsonb;
begin
 select * into strict c from public.ki_cms where id=1 for update;
 next_draft:=c.draft; next_published:=c.published; catalog:=public.ki_cms_catalog();
 for item in select value from jsonb_array_elements(catalog) where value->>'slug'=any(array['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali']) loop
  if not exists(select 1 from jsonb_array_elements(next_draft->'catalog') r where r->>'slug'=item->>'slug') then
   next_draft:=jsonb_set(next_draft,'{catalog}',(next_draft->'catalog')||jsonb_build_array(item));
  end if;
  if not exists(select 1 from jsonb_array_elements(next_published->'catalog') r where r->>'slug'=item->>'slug') then
   next_published:=jsonb_set(next_published,'{catalog}',(next_published->'catalog')||jsonb_build_array(item));
  end if;
 end loop;
 if next_draft is distinct from c.draft or next_published is distinct from c.published then
  update public.ki_cms set draft=next_draft,published=next_published,revision=revision+1,published_revision=revision+1,updated_at=now(),published_at=now() where id=1 returning * into c;
  insert into public.ki_cms_history(revision,document,actor_id,published_at) values(c.published_revision,c.published,null,c.published_at);
 end if;
 if not public.ki_cms_valid_document(c.draft) or not public.ki_cms_valid_document(c.published) or jsonb_array_length(c.draft->'catalog')<>13 or jsonb_array_length(c.published->'catalog')<>13 then raise exception 'Expanded catalog validation failed'; end if;
 -- Historical eight-theme documents remain readable. Restoring them must merge new rows in the app.
 if exists(select 1 from public.ki_cms_history where not public.ki_cms_valid_document(document)) then raise exception 'History compatibility failed'; end if;
 if jsonb_array_length(catalog)<>13 then raise exception 'Expected 13 known renderers'; end if;
 raise notice 'PASS: 13 catalog themes; legacy history retained; no customer records modified';
end $$;
notify pgrst, 'reload schema';
commit;

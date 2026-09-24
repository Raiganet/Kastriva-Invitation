-- Kastriva Invitation v1.6.0: CMS + public catalog + admin operations.
-- Dedicated staging first. Does NOT reset flags, sales, payment snapshots or customer data.
begin;
do $$ begin
 if to_regprocedure('public.ki_schema_version()') is null then raise exception 'Install 001 through 005 first'; end if;
 if public.ki_schema_version() not in (5,6) then raise exception '006 requires schema 5/6. Do not downgrade'; end if;
end $$;
alter table public.ki_templates add column if not exists sort_order integer not null default 0;
do $$ begin if to_regclass('public.ki_cms') is null then
 update public.ki_templates set sort_order=0 where slug='elegant-rose';
 update public.ki_templates set sort_order=1 where slug='modern-minimalist';
 update public.ki_templates set sort_order=2 where slug='tropical-paradise';
 update public.ki_templates set sort_order=3 where slug='rustic-wood';
 update public.ki_templates set sort_order=4 where slug='galaxy-night';
 update public.ki_templates set sort_order=5 where slug='sweet-birthday';
 update public.ki_templates set sort_order=6 where slug='aqiqah-blessing';
 update public.ki_templates set sort_order=7 where slug='corporate-event';
end if; end $$;
create or replace function public.ki_cms_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slug',slug,'name',name,'description',description,'price',price,'active',active) order by sort_order,slug),'[]'::jsonb)
 from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event']);
$$;
revoke all on function public.ki_cms_catalog() from public,anon,authenticated;

create or replace function public.ki_cms_text(v text,lo integer,hi integer) returns boolean
language sql immutable set search_path='' as $$
 select case when v is null or v ~ '[<>]' or translate(v,E'\t\n\r','') ~ '[[:cntrl:]]' or v ~ ('['||chr(128)||'-'||chr(159)||']') then false
 else coalesce((select sum(case when ch='' then 0 when ascii(ch)>65535 then 2 else 1 end) from regexp_split_to_table(v,'') chars(ch)),0)<=hi
 and coalesce((select sum(case when ch='' then 0 when ascii(ch)>65535 then 2 else 1 end) from regexp_split_to_table(btrim(v,U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'),'') chars(ch)),0)>=lo end;
$$;
revoke all on function public.ki_cms_text(text,integer,integer) from public,anon,authenticated;

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
 if jsonb_typeof(d->'catalog')<>'array' or jsonb_array_length(d->'catalog')<>8 then return false; end if;
 for item in select value from jsonb_array_elements(d->'catalog') loop
  if not public.ki_guest_keys(item,array['slug','name','description','price','active']) then return false; end if;
  if jsonb_typeof(item->'slug')<>'string' or not((item->>'slug')=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event'])) or (item->>'slug')=any(seen) then return false; end if;
  seen:=array_append(seen,item->>'slug');
  if jsonb_typeof(item->'name')<>'string' or jsonb_typeof(item->'description')<>'string' or not public.ki_cms_text(item->>'name',1,80) or not public.ki_cms_text(item->>'description',1,500) then return false; end if;
  if jsonb_typeof(item->'active')<>'boolean' or jsonb_typeof(item->'price')<>'number' or (item->>'price')::numeric<>trunc((item->>'price')::numeric) or (item->>'price')::numeric not between 1000 and 100000000 then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.ki_cms_valid_document(jsonb) from public,anon,authenticated;

create table if not exists public.ki_cms (
 id integer primary key check(id=1), draft jsonb not null, published jsonb not null,
 revision integer not null default 1 check(revision>0), published_revision integer not null default 1 check(published_revision>0 and published_revision<=revision),
 updated_at timestamptz not null default now(), published_at timestamptz not null default now(),
 check(public.ki_cms_valid_document(draft)), check(public.ki_cms_valid_document(published))
);
create table if not exists public.ki_cms_history (
 revision integer primary key, document jsonb not null, published_at timestamptz not null default now(), actor_id uuid,
 check(public.ki_cms_valid_document(document))
);
create table if not exists public.ki_cms_events (
 actor_id uuid not null, request_id uuid not null, payload jsonb not null, result jsonb not null,
 created_at timestamptz not null default now(), primary key(actor_id,request_id),
 check(octet_length(payload::text)<=32000)
);
create index if not exists ki_cms_events_created on public.ki_cms_events(created_at);
alter table public.ki_cms enable row level security;
alter table public.ki_cms_history enable row level security;
alter table public.ki_cms_events enable row level security;
revoke all on public.ki_cms,public.ki_cms_history,public.ki_cms_events from public,anon,authenticated;
-- Catalog originates from the database, so existing operator prices are not overwritten by seed JSON.
insert into public.ki_cms(id,draft,published)
select 1,jsonb_build_object('version',1,'content','{"brandName":"Kastriva","tagline":"INVITATION","heroEyebrow":"UNTUK HARI YANG TAK TERLUPAKAN","heroTitle":"Sebuah cerita.\nSatu undangan.","heroAccent":"Banyak kenangan.","heroBody":"Undang orang-orang terdekat dengan desain yang mencerminkan cerita Anda. Temukan tema favorit dan rasakan demonya sebelum memesan.","heroPrimary":"Temukan tema Anda","heroSecondary":"Coba demo","aboutTitle":"Undangan yang membawa cerita Anda.","aboutBody":"Kastriva Invitation membantu Anda menyiapkan undangan pernikahan dengan pilihan desain, editor pribadi, dan preview sebelum diterbitkan.","featuresTitle":"Personal, dari awal sampai hari istimewa.","features":[{"title":"Coba sebelum memilih","body":"Jelajahi demo tanpa akun dan pilih nuansa yang sesuai dengan cerita Anda."},{"title":"Tulis cerita Anda","body":"Isi pasangan, acara, lokasi, dan galeri dari satu studio editor."},{"title":"Kendalikan publikasi","body":"Draft tetap privat. Tinjau dan terbitkan setelah verifikasi pembayaran oleh admin."}],"collectionTitle":"Temukan desain yang terasa seperti Anda.","collectionBody":"Dari nuansa romantis hingga modern. Buka demo untuk melihat pengalaman undangan.","stepsTitle":"Dari memilih tema hingga membagikan cerita.","steps":[{"title":"Coba desainnya","body":"Buka katalog dan lihat demo interaktif tanpa membuat akun."},{"title":"Isi cerita Anda","body":"Masuk, pilih tema, dan lengkapi pasangan, waktu, lokasi, serta foto."},{"title":"Tinjau dan terbitkan","body":"Simpan draft, periksa checkout, dan ajukan verifikasi transfer. Sesudah disetujui, tinjau dan terbitkan undangan."}],"faqTitle":"Ada yang ingin Anda ketahui?","faqs":[{"question":"Bisa melihat demo sebelum membeli?","answer":"Ya. Demo dapat dibuka tanpa login. Data dalam demo bukan data pelanggan."},{"question":"Apakah draft langsung tampil untuk tamu?","answer":"Tidak. Draft bersifat privat. Pembayaran yang disetujui juga tidak menerbitkan data otomatis; pemilik harus meninjau dan menekan Terbitkan."},{"question":"Bagaimana pembayaran diverifikasi?","answer":"Pengelola mencocokkan transfer dengan mutasi rekening secara manual. Tombol Saya sudah transfer hanya mengajukan pemeriksaan, bukan bukti lunas."},{"question":"Bagaimana tamu mengisi RSVP?","answer":"Setelah layanan diaktifkan dan undangan terbit, pemilik menambahkan tamu dan membagikan tautan personal. RSVP pada demo hanya simulasi."}],"ctaTitle":"Mari mulai dengan tema yang Anda sukai.","ctaBody":"Jelajahi desainnya. Bayangkan hari istimewanya.","ctaLabel":"Lihat koleksi tema","footerText":"Merangkai cerita. Mengundang kebahagiaan.\nUndangan digital dengan sentuhan personal.","contactEmail":"","whatsapp":"","companyUrl":"https://www.kastriva.web.id","seoTitle":"Kastriva Invitation — Undangan Digital Personal","seoDescription":"Pilih tema, coba demo tanpa login, dan siapkan undangan pernikahan Anda bersama Kastriva.","allowIndex":false}'::jsonb,'catalog',public.ki_cms_catalog()),jsonb_build_object('version',1,'content','{"brandName":"Kastriva","tagline":"INVITATION","heroEyebrow":"UNTUK HARI YANG TAK TERLUPAKAN","heroTitle":"Sebuah cerita.\nSatu undangan.","heroAccent":"Banyak kenangan.","heroBody":"Undang orang-orang terdekat dengan desain yang mencerminkan cerita Anda. Temukan tema favorit dan rasakan demonya sebelum memesan.","heroPrimary":"Temukan tema Anda","heroSecondary":"Coba demo","aboutTitle":"Undangan yang membawa cerita Anda.","aboutBody":"Kastriva Invitation membantu Anda menyiapkan undangan pernikahan dengan pilihan desain, editor pribadi, dan preview sebelum diterbitkan.","featuresTitle":"Personal, dari awal sampai hari istimewa.","features":[{"title":"Coba sebelum memilih","body":"Jelajahi demo tanpa akun dan pilih nuansa yang sesuai dengan cerita Anda."},{"title":"Tulis cerita Anda","body":"Isi pasangan, acara, lokasi, dan galeri dari satu studio editor."},{"title":"Kendalikan publikasi","body":"Draft tetap privat. Tinjau dan terbitkan setelah verifikasi pembayaran oleh admin."}],"collectionTitle":"Temukan desain yang terasa seperti Anda.","collectionBody":"Dari nuansa romantis hingga modern. Buka demo untuk melihat pengalaman undangan.","stepsTitle":"Dari memilih tema hingga membagikan cerita.","steps":[{"title":"Coba desainnya","body":"Buka katalog dan lihat demo interaktif tanpa membuat akun."},{"title":"Isi cerita Anda","body":"Masuk, pilih tema, dan lengkapi pasangan, waktu, lokasi, serta foto."},{"title":"Tinjau dan terbitkan","body":"Simpan draft, periksa checkout, dan ajukan verifikasi transfer. Sesudah disetujui, tinjau dan terbitkan undangan."}],"faqTitle":"Ada yang ingin Anda ketahui?","faqs":[{"question":"Bisa melihat demo sebelum membeli?","answer":"Ya. Demo dapat dibuka tanpa login. Data dalam demo bukan data pelanggan."},{"question":"Apakah draft langsung tampil untuk tamu?","answer":"Tidak. Draft bersifat privat. Pembayaran yang disetujui juga tidak menerbitkan data otomatis; pemilik harus meninjau dan menekan Terbitkan."},{"question":"Bagaimana pembayaran diverifikasi?","answer":"Pengelola mencocokkan transfer dengan mutasi rekening secara manual. Tombol Saya sudah transfer hanya mengajukan pemeriksaan, bukan bukti lunas."},{"question":"Bagaimana tamu mengisi RSVP?","answer":"Setelah layanan diaktifkan dan undangan terbit, pemilik menambahkan tamu dan membagikan tautan personal. RSVP pada demo hanya simulasi."}],"ctaTitle":"Mari mulai dengan tema yang Anda sukai.","ctaBody":"Jelajahi desainnya. Bayangkan hari istimewanya.","ctaLabel":"Lihat koleksi tema","footerText":"Merangkai cerita. Mengundang kebahagiaan.\nUndangan digital dengan sentuhan personal.","contactEmail":"","whatsapp":"","companyUrl":"https://www.kastriva.web.id","seoTitle":"Kastriva Invitation — Undangan Digital Personal","seoDescription":"Pilih tema, coba demo tanpa login, dan siapkan undangan pernikahan Anda bersama Kastriva.","allowIndex":false}'::jsonb,'catalog',public.ki_cms_catalog())
where not exists(select 1 from public.ki_cms where id=1);
insert into public.ki_cms_history(revision,document,published_at) select published_revision,published,published_at from public.ki_cms where id=1 on conflict do nothing;

create or replace function public.ki_cms_public() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('revision',c.published_revision,'content',c.published->'content','catalog',
  coalesce((select jsonb_agg(item order by ord) from jsonb_array_elements(public.ki_cms_catalog()) with ordinality as t(item,ord) where item->'active'='true'::jsonb),'[]'::jsonb))
 from public.ki_cms c where c.id=1;
$$;
revoke all on function public.ki_cms_public() from public,anon,authenticated;
grant execute on function public.ki_cms_public() to anon,authenticated;

create or replace function public.ki_cms_read() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c public.ki_cms; catalog jsonb;
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 select * into strict c from public.ki_cms where id=1; catalog:=public.ki_cms_catalog();
 return jsonb_build_object('revision',c.revision,'published_revision',c.published_revision,'updated_at',c.updated_at,'published_at',c.published_at,
  'draft',c.draft,'live',jsonb_build_object('version',1,'content',c.published->'content','catalog',catalog),'catalog_hash',md5(catalog::text),
  'history',coalesce((select jsonb_agg(jsonb_build_object('revision',h.revision,'published_at',h.published_at,'document',h.document) order by h.revision desc) from (select revision,published_at,document from public.ki_cms_history order by revision desc limit 20) h),'[]'::jsonb));
end $$;
revoke all on function public.ki_cms_read() from public,anon,authenticated;
grant execute on function public.ki_cms_read() to authenticated;

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
  perform slug from public.ki_templates where slug=any(array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event']) order by slug for update;
  live_catalog:=public.ki_cms_catalog();
  if md5(live_catalog::text)<>p_catalog_hash then raise exception 'Catalog changed outside CMS' using errcode='P6003'; end if;
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
revoke all on function public.ki_cms_mutate(text,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.ki_cms_mutate(text,integer,uuid,text,jsonb) to authenticated;

-- Retiring a theme stops new selection/checkout, not editing an existing unchanged theme.
create or replace function public.ki_save_draft(p_id uuid,p_theme text,p_content jsonb,p_expected_revision integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); row_data public.ki_invitations; count_drafts integer;
begin
 if actor is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed email required' using errcode='42501'; end if;
 if p_id is null or p_request_id is null or p_expected_revision is null or p_expected_revision<0 or not public.ki_valid_content(p_content,actor) then raise exception 'Invalid draft' using errcode='22023'; end if;
 if not exists(select 1 from public.ki_templates where slug=p_theme and category='pernikahan' and (active=true or exists(select 1 from public.ki_invitations own where own.id=p_id and own.owner_id=actor and own.theme_slug=p_theme))) then raise exception 'Invalid theme' using errcode='22023'; end if;
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



-- Current editor options; the unchanged theme on an owned draft remains available when retired.
create or replace function public.ki_editor_catalog(p_invitation uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ki_has_confirmed_email() then raise exception 'Confirmed user required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('slug',t.slug,'name',t.name,'description',t.description,'price',t.price,'active',t.active) order by t.sort_order,t.slug)
 from public.ki_templates t where t.category='pernikahan' and (t.active or exists(select 1 from public.ki_invitations d where d.id=p_invitation and d.owner_id=auth.uid() and d.theme_slug=t.slug))),'[]'::jsonb);
end $$;
revoke all on function public.ki_editor_catalog(uuid) from public,anon,authenticated;
grant execute on function public.ki_editor_catalog(uuid) to authenticated;

create or replace function public.ki_admin_overview() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 return jsonb_build_object('orders',(select count(*) from public.ki_sales),'awaiting_review',(select count(*) from public.ki_sales where status='awaiting_review'),
 'verified_orders',(select count(*) from public.ki_sales where paid_at is not null),
 'verified_amount',coalesce((select sum(total_price) from public.ki_sales where paid_at is not null),0),
 'customers',(select count(distinct owner_id) from public.ki_sales),
 'live_publications',(select count(*) from public.ki_publications p join public.ki_sales s on s.id=p.sale_id where p.active and s.status='paid' and s.expires_at>now()),
 'expiring_soon',(select count(*) from public.ki_publications p join public.ki_sales s on s.id=p.sale_id where p.active and s.status='paid' and s.expires_at>now() and s.expires_at<=now()+interval '7 days'),
 'checkout_enabled',(select checkout_enabled from public.ki_commerce_settings where id=1),'publishing_enabled',(select publishing_enabled from public.ki_commerce_settings where id=1),'rsvp_enabled',(select enabled from public.ki_guest_platform where id=1));
end $$;
revoke all on function public.ki_admin_overview() from public,anon,authenticated;
grant execute on function public.ki_admin_overview() to authenticated;

create or replace function public.ki_admin_customers(p_query text,p_page integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.ki_is_admin() or not public.ki_has_confirmed_email() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_query is null or char_length(p_query)>80 or p_page is null or p_page not between 1 and 10000 then raise exception 'Invalid search' using errcode='22023'; end if;
 -- Operational customer directory only; never enumerates draft-only accounts or private guestbooks.
 with customers as (
  select owner_id,(array_agg(customer_name order by created_at desc,id))[1] as name,(array_agg(customer_email order by created_at desc,id))[1] as email,
   count(*) as orders,count(*) filter(where paid_at is not null) as verified_orders,max(created_at) as last_order_at
  from public.ki_sales group by owner_id
 ), matched as (
  select * from customers where p_query='' or strpos(lower(name||' '||email),lower(p_query))>0
 ), page_rows as (select * from matched order by last_order_at desc,owner_id limit 20 offset (p_page-1)*20)
 select jsonb_build_object('total',(select count(*) from matched),'page',p_page,'rows',coalesce((select jsonb_agg(to_jsonb(p) order by last_order_at desc,owner_id) from page_rows p),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.ki_admin_customers(text,integer) from public,anon,authenticated;
grant execute on function public.ki_admin_customers(text,integer) to authenticated;

create or replace function public.ki_system_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare rls_rows jsonb; storage_extra integer; application_extra integer;
begin
 if not public.ki_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('table',expected.name,'enabled',coalesce(c.relrowsecurity,false)) order by expected.name)
 into rls_rows
 from unnest(array['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events']) as expected(name)
 left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=expected.name and c.relkind='r';
 select count(*) into storage_extra from pg_policies where schemaname='storage' and tablename='objects' and policyname not in ('ki_media_owner_insert','ki_media_owner_select');
 select count(*) into application_extra from pg_policies where schemaname='public' and tablename in ('ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events')
 and policyname not in ('ki_settings_public_read','ki_templates_public_read','ki_drafts_owner_read','ki_orders_owner_or_admin_read','ki_events_admin_read','ki_commerce_read','ki_sales_read','ki_publications_read','ki_sale_events_read');
 return jsonb_build_object(
  'schema_version',6,
  'cms_writes_restricted',not exists(select 1 from unnest(array['anon','authenticated']) r(role),unnest(array['ki_cms','ki_cms_history','ki_cms_events']) t(name) where has_table_privilege(r.role,'public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'cms_admin_rpc_private',not has_function_privilege('anon','public.ki_cms_read()','EXECUTE') and not has_function_privilege('anon','public.ki_cms_mutate(text,integer,uuid,text,jsonb)','EXECUTE'),
  'cms_publication_exists',exists(select 1 from public.ki_cms where id=1),'tables_rls',rls_rows,
  'storage_private',exists(select 1 from storage.buckets where id='ki-media' and public=false),
  'storage_limit_ok',exists(select 1 from storage.buckets where id='ki-media' and file_size_limit>0 and file_size_limit<=5242880 and allowed_mime_types @> array['image/jpeg','image/png','image/webp'] and allowed_mime_types <@ array['image/jpeg','image/png','image/webp']),
  'storage_owner_policies_present',(select count(*)=2 from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('ki_media_owner_insert','ki_media_owner_select')),
  'storage_extra_policies',storage_extra,'application_extra_policies',application_extra,
  'admin_grants_restricted',not(has_table_privilege('authenticated','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_admins','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'draft_direct_writes_restricted',not(has_table_privilege('authenticated','public.ki_invitations','INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.ki_invitations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'commerce_direct_writes_restricted',not exists(select 1 from unnest(array['ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'public_photo_rpc_private',not(has_function_privilege('anon','public.ki_public_photo(text,integer,integer)','EXECUTE') or has_function_privilege('authenticated','public.ki_public_photo(text,integer,integer)','EXECUTE')),
  'checkout_enabled',coalesce((select checkout_enabled from public.ki_commerce_settings where id=1),false),
  'publishing_enabled',coalesce((select publishing_enabled from public.ki_commerce_settings where id=1),false),
  'guest_direct_access_restricted',not exists(select 1 from unnest(array['ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events']) as t(name) where has_table_privilege('authenticated','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('anon','public.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
  'rsvp_enabled',coalesce((select enabled from public.ki_guest_platform where id=1),false),
  'order_requests_enabled',coalesce((select accept_order_requests from public.ki_settings where id=1),false)
 );
end $$;
revoke all on function public.ki_system_status() from public,anon,authenticated;
grant execute on function public.ki_system_status() to authenticated;




create or replace function public.ki_schema_version() returns integer
language sql stable set search_path='' as $$ select 6; $$;
revoke all on function public.ki_schema_version() from public,anon,authenticated;
grant execute on function public.ki_schema_version() to anon,authenticated;
notify pgrst, 'reload schema';
commit;

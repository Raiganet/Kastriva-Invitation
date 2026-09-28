-- v1.8.0: read-only capability diagnostics. Base schema stays 7.
-- Does NOT turn services on, edit catalog/prices, rewrite drafts, or create a migration-history claim.
-- Apply after missing 008–011 upgrades. It can also diagnose an incomplete schema-7 installation.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if to_regprocedure('public.ki_schema_version()') is null then
  raise exception 'Install the base schema before 012';
 end if;
 if public.ki_schema_version() <> 7 or to_regprocedure('public.ki_cms_catalog()') is null
  or to_regprocedure('public.ki_valid_content(jsonb,uuid)') is null
  or to_regprocedure('public.ki_publishable_content(jsonb,uuid)') is null then
  raise exception '012 requires base schema 7. Follow the upgrade guide; do not change version markers manually';
 end if;
end $$;

create or replace function public.ki_feature_readiness() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 base jsonb := '{"groom":"Contoh","bride":"Contoh","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Lokasi pengujian sintetis","mapUrl":"","opening":"","story":"","photoPaths":[]}'::jsonb;
 probe_owner uuid := '00000000-0000-4000-8000-000000000001';
 extended jsonb; catalog jsonb := '[]'::jsonb; c public.ki_cms;
 known text[] := array['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event','islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali','elementor-luxury-1','botanical-blush'];
 heritage text[] := array['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'];
 found_slugs text[] := array[]::text[]; catalog_slugs text[] := array[]::text[];
 legacy_ok boolean := false; extras_ok boolean := false; cms_ok boolean := false;
 heritage_ok boolean := false; luxury_ok boolean := false; botanical_ok boolean := false;
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
  cms_ok := found and known_count=15 and cardinality(catalog_slugs)=15
    and known <@ catalog_slugs and catalog_slugs <@ known
    and public.ki_cms_valid_document(c.draft) is true
    and public.ki_cms_valid_document(c.published) is true
    and jsonb_array_length(c.draft->'catalog')=15
    and jsonb_array_length(c.published->'catalog')=15
    and (select count(*) from public.ki_templates where slug=any(known) and category='pernikahan')=12;
 exception when others then
  cms_ok := false; heritage_ok := false; luxury_ok := false; botanical_ok := false;
 end;
 -- Only the following fixed metadata may leave this function: no draft/CMS text, prices,
 -- hidden theme names, contacts, account IDs, tokens, Storage paths, SQL errors or keys.
 return jsonb_build_object(
  'contract_version',1,'base_schema_version',public.ki_schema_version(),'diagnostics_migration',12,
  'known_templates',known_count,
  'capabilities',jsonb_build_object('legacy_content',legacy_ok,'invitation_extras',extras_ok,
   'heritage_themes',heritage_ok,'luxury_theme',luxury_ok,'botanical_theme',botanical_ok,
   'cms_catalog_complete',cms_ok));
end $$;
revoke all on function public.ki_feature_readiness() from public,anon,authenticated,service_role;
grant execute on function public.ki_feature_readiness() to anon,authenticated,service_role;
comment on function public.ki_feature_readiness() is 'Read-only fixed capability metadata, not a migration ledger or production certification.';
notify pgrst, 'reload schema';
commit;

-- READ ONLY: safe feature inspection, not migration execution/history proof.
-- Run as database owner on the Invitation project. Contains no customer queries/outputs.
begin read only;
do $$ begin
 if to_regprocedure('public.ki_schema_version()') is null or to_regprocedure('public.ki_cms_catalog()') is null then
  raise exception 'Base migrations not present. Follow the fresh-project guide first';
 end if;
end $$;
with probe as (
 select '{"groom":"Contoh","bride":"Contoh","groomParents":"","brideParents":"","eventDate":"2027-12-25","eventTime":"08:00","endTime":"10:00","timezone":"Asia/Jakarta","venue":"Contoh","address":"Contoh","mapUrl":"","opening":"","story":"","photoPaths":[],"music":"serenade","gifts":[{"bank":"Contoh","account":"0012345678","holder":"Contoh"}]}'::jsonb as content,
 '00000000-0000-4000-8000-000000000001'::uuid as owner
), catalog as (select value->>'slug' as slug from jsonb_array_elements(public.ki_cms_catalog()))
select public.ki_schema_version() as base_schema,
 (public.ki_valid_content(content,owner) is true and public.ki_publishable_content(content,owner) is true) as music_gifts_supported,
 (select count(*)=5 from catalog where slug=any(array['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'])) as heritage_cms_supported,
 exists(select 1 from catalog where slug='elementor-luxury-1') as luxury_cms_supported,
 exists(select 1 from catalog where slug='botanical-blush') as botanical_cms_supported,
 (select count(*) from catalog) as known_cms_templates,
 to_regprocedure('public.ki_feature_readiness()') is not null as diagnostics_012_available
from probe;
rollback;

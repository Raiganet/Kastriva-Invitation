begin;
do $$
declare c public.ki_cms; previous public.ki_test_occasion_snapshot; d jsonb; metrics jsonb;
begin
 select * into strict c from public.ki_cms where id=1;
 select * into strict previous from public.ki_test_occasion_snapshot;
 if jsonb_array_length(public.ki_cms_catalog())<>20 then raise exception 'Incomplete catalog';end if;
 if c.draft->'content'<>previous.draft->'content' or c.published->'content'<>previous.published->'content' then raise exception 'Overwrote existing CMS content';end if;
 if c.revision<>previous.revision+1 then raise exception 'Replay changed CMS revision';end if;
 if not exists(select 1 from public.ki_templates where slug='elegant-rose' and price=167000 and active=false) then raise exception 'Overwrote prior pricing or activation';end if;
 if not exists(select 1 from public.ki_templates where slug='velvet-vow' and category='pernikahan' and active) or not exists(select 1 from public.ki_templates where slug='peach-confetti' and category='ulang-tahun' and active) or not exists(select 1 from public.ki_templates where slug='little-moon' and category='aqiqah' and active) or not exists(select 1 from public.ki_templates where slug='sapphire-summit' and category='acara-kantor' and active) then raise exception 'Wrong category mapping';end if;
 if not public.ki_cms_valid_document(previous.draft) or not public.ki_cms_valid_document(c.draft) or not public.ki_cms_valid_document(c.published) then raise exception 'Catalog history failed validation';end if;
 -- A 16-item history must be the original 16 identities, never an arbitrary subset.
 d:=jsonb_set(previous.draft,'{catalog,0,slug}','"velvet-vow"');
 if public.ki_cms_valid_document(d) then raise exception 'Accepted incomplete catalog substitution';end if;
 metrics:=public.ki_feature_readiness();
 if metrics->>'known_templates'<>'20' or metrics->'capabilities'->>'cms_catalog_complete'<>'true' then raise exception 'Capability metadata disagrees';end if;
 if has_function_privilege('anon','public.ki_cms_mutate(text,integer,uuid,text,jsonb)','EXECUTE') then raise exception 'CMS mutation became public';end if;
 raise notice 'PASS: 20 themes, four categories, preserved CMS content/prices, compatible history and idempotent replay';
end $$;
rollback;

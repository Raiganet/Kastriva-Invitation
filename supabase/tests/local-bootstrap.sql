-- TEST ONLY. Refuses a nonempty database. Never paste into a real Supabase SQL Editor.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' or current_user<>'postgres' then raise exception 'Disposable local test database only'; end if;
 if exists(select 1 from pg_namespace where nspname in ('auth','storage')) or exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S')) then raise exception 'Database not empty: stop, do not reset real data';end if;
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls;end if;
end $$;
create schema auth;create schema storage;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
-- Mimic default grants conservatively so explicit migration revocations are exercised.
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
create table auth.users(id uuid primary key,email text,aud text,role text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'))::uuid; $$;
create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),unique(bucket_id,name));
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
grant all on storage.buckets to service_role;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]; $$;
commit;

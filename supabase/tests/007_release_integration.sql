-- TEST ONLY on the isolated database created by scripts/test-sql-local.mjs. Entire file uses rollback.
begin;
do $$ begin
 if current_database()<>'ki_isolated_test' or public.ki_schema_version()<>7 then raise exception 'Local disposable schema7 required';end if;
 if exists(select 1 from auth.users where id='a7777777-7777-4777-8777-777777777777') then raise exception 'Fixture exists';end if;
 if (select checkout_enabled or publishing_enabled from public.ki_commerce_settings where id=1) or (select enabled from public.ki_guest_platform where id=1) then raise exception 'Migration unexpectedly opened a service';end if;
end $$;
insert into auth.users(id,email,email_confirmed_at) values('a7777777-7777-4777-8777-777777777777','local-release@example.invalid',now());
insert into public.ki_admins(user_id) values('a7777777-7777-4777-8777-777777777777');
set local role anon;
do $$ begin
 begin perform public.ki_public_invitation('not-a-live-slug');raise exception 'FAIL anonymous bypass';exception when insufficient_privilege then null;end;
 begin perform public.ki_guest_context('not-a-live-slug',repeat('a',64));raise exception 'FAIL context bypass';exception when insufficient_privilege then null;end;
 begin perform public.ki_submit_rsvp('not-a-live-slug',repeat('a',64),0,gen_random_uuid(),'yes',1,'','',false);raise exception 'FAIL write bypass';exception when insufficient_privilege then null;end;
 begin perform public.ki_public_wishes('not-a-live-slug',null);raise exception 'FAIL wishes bypass';exception when insufficient_privilege then null;end;
 begin perform public.ki_take_public_rate('page',repeat('a',64));raise exception 'FAIL user-provided identity';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.ki_public_rate_limits;raise exception 'FAIL identity table exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
do $$ declare f text;begin
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 begin perform public.ki_launch_audit();raise exception 'FAIL nonadmin audit';exception when insufficient_privilege then null;end;
 foreach f in array array['public.ki_public_invitation(text)','public.ki_guest_context(text,text)','public.ki_submit_rsvp(text,text,integer,uuid,text,integer,text,text,boolean)','public.ki_public_wishes(text,bigint)','public.ki_take_public_rate(text,text)'] loop
  if has_function_privilege(current_user,f,'EXECUTE') then raise exception 'FAIL authenticated public bypass %',f;end if;
 end loop;
end $$;
reset role;
set local role service_role;
do $$ declare r jsonb;i integer;begin
 for i in 1..60 loop
  r:=public.ki_take_public_rate('respond',repeat('7',64));
  if (r->>'allowed')::boolean is not true or (r->>'remaining')::integer<>60-i then raise exception 'FAIL accepted counter %',i;end if;
 end loop;
 r:=public.ki_take_public_rate('respond',repeat('7',64));
 if (r->>'allowed')::boolean is not false or (r->>'retry_after')::integer not between 1 and 60 then raise exception 'FAIL no rate limit';end if;
 begin perform public.ki_take_public_rate('new-scope',repeat('7',64));raise exception 'FAIL arbitrary cap';exception when invalid_parameter_value then null;end;
 if public.ki_public_invitation('not-a-live-slug') is not null then raise exception 'FAIL missing slug returns content';end if;
 if public.ki_guest_context('not-a-live-slug',repeat('a',64)) is not null then raise exception 'FAIL unknown token';end if;
end $$;
reset role;
update public.ki_public_rate_limits set window_started=now()-interval '2 minutes' where scope='respond' and identity_hash=repeat('7',64);
set local role service_role;
do $$ declare r jsonb;begin r:=public.ki_take_public_rate('respond',repeat('7',64));if (r->>'allowed')::boolean is not true or r->>'remaining'<>'59' then raise exception 'FAIL window reset';end if;end $$;
reset role;
set local role authenticated;
do $$ declare a jsonb;k text;begin
 perform set_config('request.jwt.claim.sub','a7777777-7777-4777-8777-777777777777',true);
 a:=public.ki_launch_audit();
 foreach k in array array['public_rpc_server_only','rate_rls','rate_table_private','rate_service_grant','public_service_grants'] loop if (a->>k)::boolean is not true then raise exception 'FAIL admin audit %: %',k,a;end if;end loop;
 if a ? 'identity_hash' then raise exception 'FAIL network identity leak';end if;
 if public.ki_system_status()->>'schema_version'<>'7' then raise exception 'FAIL old system status';end if;
 raise notice 'PASS stage7: RPC grants, fail-closed access, atomic sequential budget, expiry reset, admin-only diagnostics';
end $$;
reset role;
rollback;

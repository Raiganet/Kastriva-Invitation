-- v1.9.x: auto-publish consented public wishes and create friendly defaults.
-- This migration touches only general-wishes tables/functions/triggers.

alter table public.ki_open_wish_settings
  alter column accepting set default true,
  alter column showing set default true;

create or replace function public.ki_open_wish_defaults_for_sale()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.ki_open_wish_settings(sale_id, accepting, showing, revision)
  values (new.id, true, true, 1)
  on conflict (sale_id) do nothing;
  return new;
end
$$;

drop trigger if exists ki_open_wish_defaults_after_sale on public.ki_sales;
create trigger ki_open_wish_defaults_after_sale
after insert on public.ki_sales
for each row execute function public.ki_open_wish_defaults_for_sale();

insert into public.ki_open_wish_settings(sale_id, accepting, showing, revision)
select s.id, true, true, 1
from public.ki_sales s
left join public.ki_open_wish_settings w on w.sale_id=s.id
where w.sale_id is null
on conflict (sale_id) do nothing;

create or replace function public.ki_open_wish_auto_approve()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.consent is true and new.removed is false then
    new.moderation := 'approved';
  end if;
  return new;
end
$$;

drop trigger if exists ki_open_wish_auto_approve_before_insert on public.ki_open_wishes;
create trigger ki_open_wish_auto_approve_before_insert
before insert on public.ki_open_wishes
for each row execute function public.ki_open_wish_auto_approve();

update public.ki_open_wishes
set moderation='approved', revision=revision+1
where consent=true and moderation='pending' and removed=false;

comment on function public.ki_open_wish_auto_approve() is
'Automatically approves newly submitted public wishes only when the visitor explicitly consents to public display. Owner can still hide/remove later.';

notify pgrst,'reload schema';

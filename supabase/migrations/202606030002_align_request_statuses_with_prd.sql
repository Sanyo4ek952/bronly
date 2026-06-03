do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'request_status'
  ) then
    alter type public.request_status rename to request_status_old;
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.request_status as enum (
    'new',
    'accepted_by_owner',
    'rejected',
    'transferred_to_owner',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.guest_requests
  alter column status drop default;

alter table public.guest_requests
  alter column status type text
  using status::text;

update public.guest_requests
set status = case
  when status = 'owner_confirmed' then 'accepted_by_owner'
  when status = 'declined' then 'rejected'
  when status = 'in_progress' and source = 'agent' and transferred_to_owner_at is not null then 'transferred_to_owner'
  when status = 'in_progress' then 'new'
  else status
end;

alter table public.guest_requests
  alter column status type public.request_status
  using status::public.request_status;

alter table public.guest_requests
  alter column status set default 'new';

drop type if exists public.request_status_old;

alter table public.guest_requests
  add column if not exists rooms_count integer not null default 1;

update public.guest_requests
set rooms_count = greatest(
  1,
  coalesce((pricing_snapshot ->> 'rooms_count')::integer, rooms_count, 1)
);

alter table public.guest_requests
  drop constraint if exists guest_requests_rooms_count_check;

alter table public.guest_requests
  add constraint guest_requests_rooms_count_check
  check (rooms_count >= 1);

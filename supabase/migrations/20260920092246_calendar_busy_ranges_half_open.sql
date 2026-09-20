begin;

-- Occupancy uses half-open stay intervals [starts_on, ends_on):
-- starts_on is the check-in date and ends_on is the checkout date.
drop trigger if exists room_busy_ranges_enforce_boundaries on public.room_busy_ranges;

-- Preserve historical one-day blocks while moving away from starts_on = ends_on.
update public.room_busy_ranges
set ends_on = starts_on + 1
where starts_on = ends_on;

alter table public.room_busy_ranges
  drop constraint if exists room_busy_ranges_date_order;

alter table public.room_busy_ranges
  add constraint room_busy_ranges_date_order check (starts_on < ends_on);

comment on column public.room_busy_ranges.starts_on is 'Check-in date, inclusive; the first occupied night.';
comment on column public.room_busy_ranges.ends_on is 'Checkout date, exclusive; it is not an occupied night.';

create or replace function public.enforce_room_busy_range_boundaries()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.room_id::text, 0));

  if new.starts_on >= new.ends_on then
    raise exception 'Busy range checkout must be later than check-in'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.room_busy_ranges existing
    where existing.room_id = new.room_id
      and existing.id <> new.id
      and daterange(existing.starts_on, existing.ends_on, '[)')
        && daterange(new.starts_on, new.ends_on, '[)')
  ) then
    raise exception 'Busy ranges for one room must not overlap'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger room_busy_ranges_enforce_boundaries
before insert or update of room_id, starts_on, ends_on
on public.room_busy_ranges
for each row
execute function public.enforce_room_busy_range_boundaries();

create or replace function public.enforce_guest_request_availability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.room_id::text, 0));

  if exists (
    select 1
    from public.room_busy_ranges busy
    where busy.room_id = new.room_id
      and new.check_in < busy.ends_on
      and new.check_out > busy.starts_on
  ) then
    raise exception 'Guest request overlaps occupied dates'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

commit;

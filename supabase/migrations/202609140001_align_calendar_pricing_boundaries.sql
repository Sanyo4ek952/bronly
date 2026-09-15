begin;

-- Calendar occupancy is stored as an inclusive date range [starts_on, ends_on].
-- Guest stays remain [check_in, check_out): checkout is not an occupied night.
comment on column public.room_busy_ranges.starts_on is 'First occupied date, inclusive.';
comment on column public.room_busy_ranges.ends_on is 'Last occupied date, inclusive. A one-day range has starts_on = ends_on.';
comment on column public.room_seasonal_prices.starts_on is 'First night with the seasonal price, inclusive.';
comment on column public.room_seasonal_prices.ends_on is 'Last night with the seasonal price, inclusive.';
comment on column public.guest_requests.check_in is 'First stay night, inclusive.';
comment on column public.guest_requests.check_out is 'Checkout date, exclusive; it is not a stay night.';

alter table public.room_seasonal_prices
  drop constraint if exists room_seasonal_prices_no_overlap;

alter table public.room_seasonal_prices
  add constraint room_seasonal_prices_no_overlap
  exclude using gist (
    room_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
  where (is_active);

create or replace function public.enforce_room_busy_range_boundaries()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.room_id::text, 0));

  if new.starts_on > new.ends_on then
    raise exception 'Busy range starts_on must be on or before ends_on'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.room_busy_ranges existing
    where existing.room_id = new.room_id
      and existing.id <> new.id
      and daterange(existing.starts_on, existing.ends_on, '[]')
        && daterange(new.starts_on, new.ends_on, '[]')
  ) then
    raise exception 'Busy ranges for one room must not overlap'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists room_busy_ranges_enforce_boundaries on public.room_busy_ranges;
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
      and new.check_in <= busy.ends_on
      and new.check_out > busy.starts_on
  ) then
    raise exception 'Guest request overlaps occupied dates'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists guest_requests_enforce_availability on public.guest_requests;
create trigger guest_requests_enforce_availability
before insert or update of room_id, check_in, check_out
on public.guest_requests
for each row
execute function public.enforce_guest_request_availability();

create or replace function public.sync_guest_request_pricing_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  calculated_nights integer;
  calculated_total numeric(12, 2);
  calculated_nightly_prices jsonb;
  calculated_display_price numeric(12, 2);
begin
  with nightly as (
    select
      stay_date::date as night_date,
      seasonal.id as seasonal_price_id,
      round(
        coalesce(seasonal.price_per_night, room.price_per_night)
          * (1 + coalesce(new.agent_markup_percent, 0) / 100),
        2
      ) as night_price
    from public.rooms room
    cross join lateral generate_series(
      new.check_in::timestamp,
      (new.check_out - 1)::timestamp,
      interval '1 day'
    ) as stay_date
    left join lateral (
      select price.id, price.price_per_night
      from public.room_seasonal_prices price
      where price.room_id = new.room_id
        and price.is_active
        and stay_date::date between price.starts_on and price.ends_on
      limit 1
    ) seasonal on true
    where room.id = new.room_id
  )
  select
    count(*)::integer,
    coalesce(sum(night_price), 0)::numeric(12, 2),
    coalesce(
      jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'date', night_date::text,
          'pricePerNight', night_price,
          'source', case when seasonal_price_id is null then 'base' else 'seasonal' end,
          'seasonalPriceId', seasonal_price_id
        ))
        order by night_date
      ),
      '[]'::jsonb
    )
  into calculated_nights, calculated_total, calculated_nightly_prices
  from nightly;

  calculated_display_price := round(calculated_total / greatest(calculated_nights, 1));
  new.total_price := calculated_total;
  new.pricing_snapshot := coalesce(new.pricing_snapshot, '{}'::jsonb) || jsonb_build_object(
    'nights', calculated_nights,
    'display_price_per_night', calculated_display_price,
    'total_price', calculated_total,
    'nightly_prices', calculated_nightly_prices
  );

  return new;
end;
$$;

drop trigger if exists guest_requests_sync_pricing_snapshot on public.guest_requests;
create trigger guest_requests_sync_pricing_snapshot
before insert or update of room_id, check_in, check_out, agent_markup_percent
on public.guest_requests
for each row
execute function public.sync_guest_request_pricing_snapshot();

commit;

drop policy if exists "property_features_owner_manage" on public.property_features;
create policy "property_features_owner_manage"
on public.property_features
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_features.property_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_features.property_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "property_rules_owner_manage" on public.property_rules;
create policy "property_rules_owner_manage"
on public.property_rules
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_rules.property_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_rules.property_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_amenities_owner_manage" on public.room_amenities;
create policy "room_amenities_owner_manage"
on public.room_amenities
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_amenities.room_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_amenities.room_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_seasonal_prices_owner_manage" on public.room_seasonal_prices;
create policy "room_seasonal_prices_owner_manage"
on public.room_seasonal_prices
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_seasonal_prices.room_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_seasonal_prices.room_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_busy_ranges_owner_manage" on public.room_busy_ranges;
create policy "room_busy_ranges_owner_manage"
on public.room_busy_ranges
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_busy_ranges.room_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_busy_ranges.room_id
      and p.owner_id = public.current_profile_id()
  )
);

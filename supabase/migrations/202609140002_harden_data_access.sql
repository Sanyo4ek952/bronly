begin;

create or replace function public.current_profile_has_role(expected_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles role_row
    where role_row.profile_id = public.current_profile_id()
      and role_row.role = expected_role
  )
$$;

revoke all on function public.current_profile_has_role(public.app_role) from public;
grant execute on function public.current_profile_has_role(public.app_role) to authenticated;

create or replace function public.enforce_room_owner_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  property_owner_id uuid;
begin
  if new.room_kind = 'standalone_room' then
    if new.property_id is not null then
      raise exception 'Standalone room must not reference a property' using errcode = '23514';
    end if;
    return new;
  end if;

  select property_row.owner_id
  into property_owner_id
  from public.properties property_row
  where property_row.id = new.property_id;

  if property_owner_id is null or property_owner_id <> new.owner_id then
    raise exception 'Property room owner must match property owner' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists rooms_enforce_owner_scope on public.rooms;
create trigger rooms_enforce_owner_scope
before insert or update of property_id, owner_id, room_kind
on public.rooms
for each row
execute function public.enforce_room_owner_scope();

drop policy if exists "properties_owner_manage" on public.properties;
create policy "properties_owner_manage"
on public.properties
for all
to authenticated
using (
  public.current_profile_has_role('owner')
  and owner_id = public.current_profile_id()
)
with check (
  public.current_profile_has_role('owner')
  and owner_id = public.current_profile_id()
);

drop policy if exists "rooms_owner_manage" on public.rooms;
create policy "rooms_owner_manage"
on public.rooms
for all
to authenticated
using (
  public.current_profile_has_role('owner')
  and owner_id = public.current_profile_id()
  and (
    (
      room_kind = 'property_room'
      and exists (
        select 1
        from public.properties p
        where p.id = rooms.property_id
          and p.owner_id = public.current_profile_id()
          and p.owner_id = rooms.owner_id
      )
    )
    or (room_kind = 'standalone_room' and property_id is null)
  )
)
with check (
  public.current_profile_has_role('owner')
  and owner_id = public.current_profile_id()
  and (
    (
      room_kind = 'property_room'
      and exists (
        select 1
        from public.properties p
        where p.id = rooms.property_id
          and p.owner_id = public.current_profile_id()
          and p.owner_id = rooms.owner_id
      )
    )
    or (room_kind = 'standalone_room' and property_id is null)
  )
);

drop policy if exists "rooms_agent_read_active_links" on public.rooms;
create policy "rooms_agent_read_active_links"
on public.rooms
for select
to authenticated
using (
  public.current_profile_has_role('agent')
  and (
    exists (
      select 1
      from public.agent_property_links property_link
      where property_link.property_id = rooms.property_id
        and property_link.agent_id = public.current_profile_id()
        and property_link.status = 'active'
    )
    or exists (
      select 1
      from public.agent_room_links room_link
      where room_link.room_id = rooms.id
        and room_link.agent_id = public.current_profile_id()
        and room_link.status = 'active'
    )
  )
);

drop policy if exists "room_amenities_public_read" on public.room_amenities;
create policy "room_amenities_public_read"
on public.room_amenities
for select
to public
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_amenities.room_id
      and r.is_active = true
      and (
        (
          r.room_kind = 'property_room'
          and exists (
            select 1
            from public.properties p
            where p.id = r.property_id
              and p.published = true
              and p.is_frozen = false
          )
        )
        or (r.room_kind = 'standalone_room' and r.property_id is null)
      )
  )
);

drop policy if exists "room_amenities_owner_manage" on public.room_amenities;
create policy "room_amenities_owner_manage"
on public.room_amenities
for all
to authenticated
using (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_amenities.room_id
      and r.owner_id = public.current_profile_id()
  )
)
with check (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_amenities.room_id
      and r.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_seasonal_prices_owner_read" on public.room_seasonal_prices;
drop policy if exists "room_seasonal_prices_owner_manage" on public.room_seasonal_prices;
create policy "room_seasonal_prices_owner_manage"
on public.room_seasonal_prices
for all
to authenticated
using (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_seasonal_prices.room_id
      and r.owner_id = public.current_profile_id()
  )
)
with check (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_seasonal_prices.room_id
      and r.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_busy_ranges_property_access" on public.room_busy_ranges;
drop policy if exists "room_busy_ranges_owner_manage" on public.room_busy_ranges;
create policy "room_busy_ranges_owner_manage"
on public.room_busy_ranges
for all
to authenticated
using (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_busy_ranges.room_id
      and r.owner_id = public.current_profile_id()
  )
)
with check (
  public.current_profile_has_role('owner')
  and exists (
    select 1 from public.rooms r
    where r.id = room_busy_ranges.room_id
      and r.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_busy_ranges_agent_read" on public.room_busy_ranges;
create policy "room_busy_ranges_agent_read"
on public.room_busy_ranges
for select
to authenticated
using (
  public.current_profile_has_role('agent')
  and exists (
    select 1
    from public.rooms r
    where r.id = room_busy_ranges.room_id
      and (
        exists (
          select 1 from public.agent_property_links property_link
          where property_link.property_id = r.property_id
            and property_link.agent_id = public.current_profile_id()
            and property_link.status = 'active'
        )
        or exists (
          select 1 from public.agent_room_links room_link
          where room_link.room_id = r.id
            and room_link.agent_id = public.current_profile_id()
            and room_link.status = 'active'
        )
      )
  )
);

drop policy if exists "room_agent_markups_owner_or_agent" on public.room_agent_markups;
create policy "room_agent_markups_owner_or_agent"
on public.room_agent_markups
for select
to authenticated
using (
  (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'))
  or exists (
    select 1 from public.rooms r
    where r.id = room_agent_markups.room_id
      and r.owner_id = public.current_profile_id()
      and public.current_profile_has_role('owner')
  )
);

drop policy if exists "room_agent_markups_insert_agent" on public.room_agent_markups;
create policy "room_agent_markups_insert_agent"
on public.room_agent_markups
for insert
to authenticated
with check (
  agent_id = public.current_profile_id()
  and public.current_profile_has_role('agent')
  and exists (
    select 1 from public.rooms r
    where r.id = room_agent_markups.room_id
      and (
        r.owner_id = public.current_profile_id()
        or exists (
          select 1 from public.agent_property_links property_link
          where property_link.property_id = r.property_id
            and property_link.agent_id = public.current_profile_id()
            and property_link.status = 'active'
        )
        or exists (
          select 1 from public.agent_room_links room_link
          where room_link.room_id = r.id
            and room_link.agent_id = public.current_profile_id()
            and room_link.status = 'active'
        )
      )
  )
);

drop policy if exists "room_agent_markups_update_agent" on public.room_agent_markups;
create policy "room_agent_markups_update_agent"
on public.room_agent_markups
for update
to authenticated
using (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'))
with check (
  agent_id = public.current_profile_id()
  and public.current_profile_has_role('agent')
  and exists (
    select 1 from public.rooms r
    where r.id = room_agent_markups.room_id
      and (
        r.owner_id = public.current_profile_id()
        or exists (
          select 1 from public.agent_property_links property_link
          where property_link.property_id = r.property_id
            and property_link.agent_id = public.current_profile_id()
            and property_link.status = 'active'
        )
        or exists (
          select 1 from public.agent_room_links room_link
          where room_link.room_id = r.id
            and room_link.agent_id = public.current_profile_id()
            and room_link.status = 'active'
        )
      )
  )
);

create or replace function public.enforce_guest_request_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  request_room public.rooms%rowtype;
begin
  select * into request_room from public.rooms where id = new.room_id;

  if request_room.id is null
    or new.owner_id <> request_room.owner_id
    or new.property_id is distinct from request_room.property_id then
    raise exception 'Guest request scope does not match room scope' using errcode = '23514';
  end if;

  if btrim(new.guest_name) = '' or btrim(new.guest_phone) = ''
    or length(new.guest_name) > 120 or length(new.guest_phone) > 80
    or coalesce(length(new.guest_comment), 0) > 2000
    or new.adults_count not between 1 and 20
    or new.rooms_count not between 1 and 20
    or new.adults_count > request_room.capacity
    or new.rooms_count > request_room.bedrooms then
    raise exception 'Guest request payload is invalid' using errcode = '23514';
  end if;

  if (new.source = 'owner' and (new.agent_id is not null or new.collection_id is not null))
    or (new.source = 'agent' and (new.agent_id is null or new.collection_id is not null))
    or (new.source = 'collection' and new.collection_id is null) then
    raise exception 'Guest request source context is invalid' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists guest_requests_enforce_scope on public.guest_requests;
create trigger guest_requests_enforce_scope
before insert or update of source, property_id, room_id, owner_id, agent_id, collection_id,
  guest_name, guest_phone, guest_comment, adults_count, rooms_count
on public.guest_requests
for each row
execute function public.enforce_guest_request_scope();

create or replace function public.enforce_guest_request_actor_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid;
  actor_is_owner boolean;
  actor_is_agent boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  actor_id := public.current_profile_id();
  actor_is_owner := public.current_profile_has_role('owner');
  actor_is_agent := public.current_profile_has_role('agent');

  if new.source is distinct from old.source
    or new.property_id is distinct from old.property_id
    or new.room_id is distinct from old.room_id
    or new.owner_id is distinct from old.owner_id
    or new.agent_id is distinct from old.agent_id
    or new.collection_id is distinct from old.collection_id
    or new.guest_name is distinct from old.guest_name
    or new.guest_phone is distinct from old.guest_phone
    or new.guest_email is distinct from old.guest_email
    or new.guest_comment is distinct from old.guest_comment
    or new.adults_count is distinct from old.adults_count
    or new.children_count is distinct from old.children_count
    or new.rooms_count is distinct from old.rooms_count
    or new.check_in is distinct from old.check_in
    or new.check_out is distinct from old.check_out
    or new.base_price_per_night is distinct from old.base_price_per_night
    or new.agent_markup_percent is distinct from old.agent_markup_percent
    or new.total_price is distinct from old.total_price
    or new.pricing_snapshot is distinct from old.pricing_snapshot
    or new.created_at is distinct from old.created_at then
    raise exception 'Guest request scope and guest data are immutable' using errcode = '42501';
  end if;

  if actor_is_owner and old.owner_id = actor_id then
    if not (
      (
        old.status = 'new'
        and old.agent_id is null
        and new.status in ('accepted_by_owner', 'rejected')
      )
      or (
        old.status = 'transferred_to_owner'
        and new.status in ('accepted_by_owner', 'rejected')
      )
      or (
        old.status = 'accepted_by_owner'
        and new.status in ('rejected', 'completed')
      )
    ) then
      raise exception 'Owner request status transition is not allowed' using errcode = '42501';
    end if;

    if new.transferred_to_owner_at is distinct from old.transferred_to_owner_at
      or new.completion_requested_at is distinct from old.completion_requested_at then
      raise exception 'Owner cannot change agent workflow timestamps' using errcode = '42501';
    end if;

    return new;
  end if;

  if actor_is_agent and old.agent_id = actor_id and old.source in ('agent', 'collection') then
    if old.status = 'new' and new.status = 'transferred_to_owner' then
      if new.transferred_to_owner_at is null
        or new.owner_confirmed_at is distinct from old.owner_confirmed_at
        or new.completion_requested_at is distinct from old.completion_requested_at
        or new.completed_at is distinct from old.completed_at then
        raise exception 'Agent transfer payload is invalid' using errcode = '42501';
      end if;
      return new;
    end if;

    if old.status = 'accepted_by_owner'
      and new.status = old.status
      and old.completion_requested_at is null
      and new.completion_requested_at is not null
      and new.transferred_to_owner_at is not distinct from old.transferred_to_owner_at
      and new.owner_confirmed_at is not distinct from old.owner_confirmed_at
      and new.completed_at is not distinct from old.completed_at then
      return new;
    end if;

    raise exception 'Agent request transition is not allowed' using errcode = '42501';
  end if;

  raise exception 'Guest request update is not allowed' using errcode = '42501';
end;
$$;

drop trigger if exists guest_requests_enforce_actor_update on public.guest_requests;
create trigger guest_requests_enforce_actor_update
before update
on public.guest_requests
for each row
execute function public.enforce_guest_request_actor_update();

drop policy if exists "guest_requests_owner_or_agent_read" on public.guest_requests;
drop policy if exists "guest_requests_owner_or_agent_update" on public.guest_requests;

drop policy if exists "guest_requests_owner_read" on public.guest_requests;
create policy "guest_requests_owner_read"
on public.guest_requests
for select
to authenticated
using (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and (agent_id is null or status <> 'new')
);

drop policy if exists "guest_requests_agent_read" on public.guest_requests;
create policy "guest_requests_agent_read"
on public.guest_requests
for select
to authenticated
using (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'));

drop policy if exists "guest_requests_owner_update" on public.guest_requests;
create policy "guest_requests_owner_update"
on public.guest_requests
for update
to authenticated
using (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and (agent_id is null or status <> 'new')
)
with check (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and (agent_id is null or status <> 'new')
);

drop policy if exists "guest_requests_agent_update" on public.guest_requests;
create policy "guest_requests_agent_update"
on public.guest_requests
for update
to authenticated
using (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'))
with check (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'));

commit;

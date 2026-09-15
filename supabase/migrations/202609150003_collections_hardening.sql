begin;

update public.collections
set guest_label = null
where guest_label is not null and btrim(guest_label) = '';

alter table public.collections
  drop constraint if exists collections_creator_role_check,
  drop constraint if exists collections_title_length_check,
  drop constraint if exists collections_guest_label_length_check,
  drop constraint if exists collections_views_count_check;

alter table public.collections
  add constraint collections_creator_role_check check (creator_role in ('owner', 'agent')),
  add constraint collections_title_length_check check (char_length(btrim(title)) between 1 and 120),
  add constraint collections_guest_label_length_check check (guest_label is null or char_length(btrim(guest_label)) between 1 and 160),
  add constraint collections_views_count_check check (views_count >= 0);

with duplicate_items as (
  select id, row_number() over (
    partition by collection_id, property_id, room_id
    order by created_at, id
  ) as duplicate_number
  from public.collection_items
)
delete from public.collection_items item
using duplicate_items duplicate
where item.id = duplicate.id
  and duplicate.duplicate_number > 1;

create unique index if not exists collection_items_unique_property
  on public.collection_items (collection_id, property_id)
  where property_id is not null;

create unique index if not exists collection_items_unique_room
  on public.collection_items (collection_id, room_id)
  where room_id is not null;

create or replace function public.enforce_collection_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.creator_role not in ('owner', 'agent')
    or not exists (
      select 1
      from public.user_roles role_row
      where role_row.profile_id = new.creator_id
        and role_row.role = new.creator_role
    ) then
    raise exception 'Collection creator role is not allowed' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if new.creator_id is distinct from old.creator_id
      or new.creator_role is distinct from old.creator_role
      or new.slug is distinct from old.slug
      or new.created_at is distinct from old.created_at then
      raise exception 'Collection identity is immutable' using errcode = '42501';
    end if;

    if auth.role() = 'authenticated'
      and coalesce(current_setting('bronly.collection_stats_write', true), 'off') <> 'on'
      and (
      new.views_count is distinct from old.views_count
      or new.first_opened_at is distinct from old.first_opened_at
      or new.last_opened_at is distinct from old.last_opened_at
    ) then
      raise exception 'Collection statistics are managed by the service' using errcode = '42501';
    end if;

    if old.is_archived and (
      new.title is distinct from old.title
      or new.guest_label is distinct from old.guest_label
      or not new.is_archived
    ) then
      raise exception 'Archived collection is read only' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists collections_enforce_write on public.collections;
create trigger collections_enforce_write
before insert or update
on public.collections
for each row
execute function public.enforce_collection_write();

create or replace function public.enforce_collection_item_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_collection public.collections%rowtype;
  target_owner_id uuid;
  target_property_id uuid;
  target_room_kind text;
begin
  if tg_op = 'DELETE' then
    select collection_row.*
    into target_collection
    from public.collections collection_row
    where collection_row.id = old.collection_id;
  else
    select collection_row.*
    into target_collection
    from public.collections collection_row
    where collection_row.id = new.collection_id;
  end if;

  if target_collection.id is null then
    raise exception 'Collection was not found' using errcode = '23503';
  end if;

  if target_collection.is_archived then
    raise exception 'Archived collection is read only' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.property_id is not null then
    select property_row.owner_id
    into target_owner_id
    from public.properties property_row
    where property_row.id = new.property_id;

    if target_owner_id is null or not (
      target_owner_id = target_collection.creator_id
      or (
        target_collection.creator_role = 'agent'
        and exists (
          select 1
          from public.agent_property_links property_link
          where property_link.property_id = new.property_id
            and property_link.agent_id = target_collection.creator_id
            and property_link.status = 'active'
        )
      )
    ) then
      raise exception 'Property is not available to the collection creator' using errcode = '42501';
    end if;
  else
    select room_row.owner_id, room_row.property_id, room_row.room_kind
    into target_owner_id, target_property_id, target_room_kind
    from public.rooms room_row
    where room_row.id = new.room_id;

    if target_owner_id is null or not (
      target_owner_id = target_collection.creator_id
      or (
        target_collection.creator_role = 'agent'
        and (
          (
            target_room_kind = 'property_room'
            and exists (
              select 1
              from public.agent_property_links property_link
              where property_link.property_id = target_property_id
                and property_link.agent_id = target_collection.creator_id
                and property_link.status = 'active'
            )
          )
          or (
            target_room_kind = 'standalone_room'
            and exists (
              select 1
              from public.agent_room_links room_link
              where room_link.room_id = new.room_id
                and room_link.agent_id = target_collection.creator_id
                and room_link.status = 'active'
            )
          )
        )
      )
    ) then
      raise exception 'Room is not available to the collection creator' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists collection_items_enforce_write on public.collection_items;
create trigger collection_items_enforce_write
before insert or update or delete
on public.collection_items
for each row
execute function public.enforce_collection_item_write();

create or replace function public.enforce_guest_request_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  request_room public.rooms%rowtype;
  request_collection public.collections%rowtype;
  canonical_markup numeric(5, 2);
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

  if new.source = 'collection' then
    select collection_row.*
    into request_collection
    from public.collections collection_row
    where collection_row.id = new.collection_id;

    if request_collection.id is null
      or request_collection.is_archived
      or exists (
        select 1 from public.profiles profile_row
        where profile_row.id = request_collection.creator_id
          and profile_row.is_public_hidden_by_admin
      )
      or not exists (
        select 1 from public.user_roles role_row
        where role_row.profile_id = request_collection.creator_id
          and role_row.role = request_collection.creator_role
      )
      or not exists (
        select 1 from public.collection_items item
        where item.collection_id = request_collection.id
          and (
            item.room_id = request_room.id
            or (request_room.property_id is not null and item.property_id = request_room.property_id)
          )
      ) then
      raise exception 'Collection request context is invalid' using errcode = '23514';
    end if;

    if request_collection.creator_role = 'owner' then
      if request_collection.creator_id <> request_room.owner_id
        or new.agent_id is not null
        or new.agent_markup_percent is not null then
        raise exception 'Owner collection request context is invalid' using errcode = '23514';
      end if;
    else
      if new.agent_id is distinct from request_collection.creator_id then
        raise exception 'Agent collection request context is invalid' using errcode = '23514';
      end if;

      if request_collection.creator_id <> request_room.owner_id and not (
        (
          request_room.room_kind = 'property_room'
          and exists (
            select 1 from public.agent_property_links property_link
            where property_link.property_id = request_room.property_id
              and property_link.agent_id = request_collection.creator_id
              and property_link.status = 'active'
          )
        )
        or (
          request_room.room_kind = 'standalone_room'
          and exists (
            select 1 from public.agent_room_links room_link
            where room_link.room_id = request_room.id
              and room_link.agent_id = request_collection.creator_id
              and room_link.status = 'active'
          )
        )
      ) then
        raise exception 'Agent collection collaboration is inactive' using errcode = '23514';
      end if;

      select coalesce(markup.markup_percent, 0)
      into canonical_markup
      from (select 1) seed
      left join public.room_agent_markups markup
        on markup.room_id = request_room.id
       and markup.agent_id = request_collection.creator_id;

      if new.agent_markup_percent is distinct from canonical_markup then
        raise exception 'Agent collection price context is invalid' using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists "collections_creator_manage" on public.collections;
drop policy if exists "collections_creator_read" on public.collections;
drop policy if exists "collections_creator_insert" on public.collections;
drop policy if exists "collections_creator_update" on public.collections;

create policy "collections_creator_read"
on public.collections
for select
to authenticated
using (creator_id = public.current_profile_id() and public.current_profile_has_role(creator_role));

create policy "collections_creator_insert"
on public.collections
for insert
to authenticated
with check (
  creator_id = public.current_profile_id()
  and creator_role in ('owner', 'agent')
  and public.current_profile_has_role(creator_role)
);

create policy "collections_creator_update"
on public.collections
for update
to authenticated
using (creator_id = public.current_profile_id() and public.current_profile_has_role(creator_role))
with check (creator_id = public.current_profile_id() and public.current_profile_has_role(creator_role));

drop policy if exists "collection_items_creator_manage" on public.collection_items;
drop policy if exists "collection_items_creator_read" on public.collection_items;
drop policy if exists "collection_items_creator_insert" on public.collection_items;
drop policy if exists "collection_items_creator_update" on public.collection_items;
drop policy if exists "collection_items_creator_delete" on public.collection_items;

create policy "collection_items_creator_read"
on public.collection_items
for select
to authenticated
using (
  exists (
    select 1 from public.collections collection_row
    where collection_row.id = collection_items.collection_id
      and collection_row.creator_id = public.current_profile_id()
      and public.current_profile_has_role(collection_row.creator_role)
  )
);

create policy "collection_items_creator_insert"
on public.collection_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.collections collection_row
    where collection_row.id = collection_items.collection_id
      and collection_row.creator_id = public.current_profile_id()
      and public.current_profile_has_role(collection_row.creator_role)
      and not collection_row.is_archived
  )
);

create policy "collection_items_creator_update"
on public.collection_items
for update
to authenticated
using (
  exists (
    select 1 from public.collections collection_row
    where collection_row.id = collection_items.collection_id
      and collection_row.creator_id = public.current_profile_id()
      and public.current_profile_has_role(collection_row.creator_role)
      and not collection_row.is_archived
  )
)
with check (
  exists (
    select 1 from public.collections collection_row
    where collection_row.id = collection_items.collection_id
      and collection_row.creator_id = public.current_profile_id()
      and public.current_profile_has_role(collection_row.creator_role)
      and not collection_row.is_archived
  )
);

create policy "collection_items_creator_delete"
on public.collection_items
for delete
to authenticated
using (
  exists (
    select 1 from public.collections collection_row
    where collection_row.id = collection_items.collection_id
      and collection_row.creator_id = public.current_profile_id()
      and public.current_profile_has_role(collection_row.creator_role)
      and not collection_row.is_archived
  )
);

create table if not exists public.collection_events (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  event_type text not null default 'open' check (event_type = 'open'),
  visitor_key uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (collection_id, event_type, visitor_key)
);

alter table public.collection_events enable row level security;

create or replace function public.record_collection_open(p_collection_slug text, p_visitor_key uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_collection_id uuid;
  opened_at timestamptz := timezone('utc', now());
  inserted_rows integer;
begin
  select collection_row.id
  into target_collection_id
  from public.collections collection_row
  where collection_row.slug = p_collection_slug
    and not collection_row.is_archived
  for update;

  if target_collection_id is null then
    return false;
  end if;

  insert into public.collection_events (collection_id, event_type, visitor_key, created_at)
  values (target_collection_id, 'open', p_visitor_key, opened_at)
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 0 then
    return false;
  end if;

  perform set_config('bronly.collection_stats_write', 'on', true);

  update public.collections
  set views_count = views_count + 1,
      first_opened_at = coalesce(first_opened_at, opened_at),
      last_opened_at = opened_at
  where id = target_collection_id;

  perform set_config('bronly.collection_stats_write', 'off', true);

  return true;
end;
$$;

revoke all on function public.record_collection_open(text, uuid) from public;
grant execute on function public.record_collection_open(text, uuid) to service_role;

commit;

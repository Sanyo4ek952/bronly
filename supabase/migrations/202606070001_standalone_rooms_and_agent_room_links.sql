alter table public.rooms
  alter column property_id drop not null;

alter table public.rooms
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists room_kind text not null default 'property_room',
  add column if not exists property_type text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists timezone text,
  add column if not exists short_description text,
  add column if not exists full_description text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists telegram text,
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists allow_agent_inquiries boolean not null default false,
  add column if not exists allow_owner_contact_sharing boolean not null default false;

update public.rooms r
set owner_id = p.owner_id
from public.properties p
where r.property_id = p.id
  and r.owner_id is null;

alter table public.rooms
  alter column owner_id set not null;

alter table public.rooms
  drop constraint if exists rooms_room_kind_check;

alter table public.rooms
  add constraint rooms_room_kind_check
  check (room_kind in ('property_room', 'standalone_room'));

alter table public.rooms
  drop constraint if exists rooms_scope_check;

alter table public.rooms
  add constraint rooms_scope_check
  check (
    (room_kind = 'property_room' and property_id is not null and owner_id is not null)
    or (
      room_kind = 'standalone_room'
      and property_id is null
      and owner_id is not null
      and property_type is not null
      and city is not null
      and address is not null
      and timezone is not null
    )
  );

drop index if exists rooms_property_id_idx;
create index if not exists rooms_property_id_idx on public.rooms(property_id) where property_id is not null;
create index if not exists rooms_owner_id_idx on public.rooms(owner_id);
create index if not exists rooms_owner_scope_idx on public.rooms(owner_id, room_kind, city, is_active);

alter table public.guest_requests
  alter column property_id drop not null;

alter table public.guest_requests
  drop constraint if exists guest_requests_scope_check;

alter table public.guest_requests
  add constraint guest_requests_scope_check
  check (
    (property_id is not null)
    or (property_id is null)
  );

create table if not exists public.agent_room_links (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  status public.agent_link_status not null default 'pending',
  proposal_message text,
  collaboration_terms text,
  owner_contact_visible boolean not null default false,
  proposed_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (room_id, agent_id)
);

create index if not exists agent_room_links_owner_id_idx on public.agent_room_links(owner_id);
create index if not exists agent_room_links_agent_id_idx on public.agent_room_links(agent_id);

alter table public.agent_room_links enable row level security;

drop policy if exists "agent_room_links_owner_or_agent" on public.agent_room_links;
create policy "agent_room_links_owner_or_agent"
on public.agent_room_links
for select
to authenticated
using (
  owner_id = public.current_profile_id()
  or agent_id = public.current_profile_id()
);

drop policy if exists "agent_room_links_insert_agent" on public.agent_room_links;
create policy "agent_room_links_insert_agent"
on public.agent_room_links
for insert
to authenticated
with check (agent_id = public.current_profile_id());

drop policy if exists "agent_room_links_update_owner" on public.agent_room_links;
create policy "agent_room_links_update_owner"
on public.agent_room_links
for update
to authenticated
using (owner_id = public.current_profile_id() or agent_id = public.current_profile_id())
with check (owner_id = public.current_profile_id() or agent_id = public.current_profile_id());

drop policy if exists "rooms_public_read" on public.rooms;
create policy "rooms_public_read"
on public.rooms
for select
to public
using (
  is_active = true
  and (
    (
      room_kind = 'property_room'
      and exists (
        select 1
        from public.properties p
        where p.id = rooms.property_id
          and p.published = true
          and p.is_frozen = false
      )
    )
    or room_kind = 'standalone_room'
  )
);

drop policy if exists "rooms_owner_manage" on public.rooms;
create policy "rooms_owner_manage"
on public.rooms
for all
to authenticated
using (
  (
    room_kind = 'property_room'
    and owner_id = public.current_profile_id()
  )
  or (
    room_kind = 'standalone_room'
    and owner_id = public.current_profile_id()
  )
)
with check (
  (
    room_kind = 'property_room'
    and owner_id = public.current_profile_id()
  )
  or (
    room_kind = 'standalone_room'
    and owner_id = public.current_profile_id()
  )
);

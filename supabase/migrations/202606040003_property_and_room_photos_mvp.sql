insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_photos_property_id_sort_order_idx
  on public.property_photos(property_id, sort_order, created_at);

create index if not exists room_photos_room_id_sort_order_idx
  on public.room_photos(room_id, sort_order, created_at);

insert into public.property_photos (property_id, storage_path, public_url, sort_order)
select
  p.id,
  'legacy/property/' || p.id::text,
  p.cover_image_url,
  0
from public.properties p
where p.cover_image_url is not null
  and btrim(p.cover_image_url) <> ''
  and not exists (
    select 1
    from public.property_photos pp
    where pp.property_id = p.id
  )
on conflict (storage_path) do nothing;

alter table public.property_photos enable row level security;
alter table public.room_photos enable row level security;

drop policy if exists "property_photos_public_read" on public.property_photos;
create policy "property_photos_public_read"
on public.property_photos
for select
to public
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_photos.property_id
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "property_photos_owner_manage" on public.property_photos;
create policy "property_photos_owner_manage"
on public.property_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_photos.property_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_photos.property_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "property_photos_agent_read_active_links" on public.property_photos;
create policy "property_photos_agent_read_active_links"
on public.property_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.agent_property_links apl
    join public.properties p on p.id = apl.property_id
    where p.id = property_photos.property_id
      and apl.agent_id = public.current_profile_id()
      and apl.status = 'active'
  )
);

drop policy if exists "room_photos_public_read" on public.room_photos;
create policy "room_photos_public_read"
on public.room_photos
for select
to public
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_photos.room_id
      and r.is_active = true
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "room_photos_owner_manage" on public.room_photos;
create policy "room_photos_owner_manage"
on public.room_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_photos.room_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_photos.room_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_photos_agent_read_active_links" on public.room_photos;
create policy "room_photos_agent_read_active_links"
on public.room_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    join public.agent_property_links apl on apl.property_id = p.id
    where r.id = room_photos.room_id
      and apl.agent_id = public.current_profile_id()
      and apl.status = 'active'
  )
);

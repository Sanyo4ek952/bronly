create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  create type public.app_role as enum ('owner', 'agent', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_link_status as enum ('pending', 'active', 'declined', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.request_status as enum ('new', 'in_progress', 'owner_confirmed', 'declined', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.request_source as enum ('owner', 'agent', 'collection');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum ('trial', 'active', 'grace', 'expired', 'manual');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  slug text unique,
  display_name text not null,
  phone text,
  whatsapp text,
  telegram text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create table if not exists public.user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, role)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  short_title text not null,
  property_type text not null,
  city text not null,
  address text not null,
  timezone text not null default '(UTC+03:00) Москва',
  short_description text,
  full_description text,
  phone text,
  whatsapp text,
  telegram text,
  check_in_time text,
  check_out_time text,
  published boolean not null default true,
  is_frozen boolean not null default false,
  allow_agent_inquiries boolean not null default false,
  allow_owner_contact_sharing boolean not null default false,
  cover_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_features (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.property_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  capacity integer not null default 1,
  bedrooms integer not null default 1,
  area integer not null default 0,
  price_per_night numeric(12, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (property_id, slug)
);

create table if not exists public.room_amenities (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.room_seasonal_prices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  price_per_night numeric(12, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint room_seasonal_prices_date_order check (starts_on <= ends_on)
);

create index if not exists room_seasonal_prices_room_id_idx on public.room_seasonal_prices(room_id);
create index if not exists room_seasonal_prices_period_idx on public.room_seasonal_prices(starts_on, ends_on);

alter table public.room_seasonal_prices
  add constraint room_seasonal_prices_no_overlap
  exclude using gist (
    room_id with =,
    daterange(starts_on, ends_on + 1, '[]') with &&
  )
  where (is_active);

create table if not exists public.room_busy_ranges (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  source text not null default 'manual',
  label text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint room_busy_ranges_date_order check (starts_on <= ends_on)
);

create table if not exists public.agent_property_links (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  status public.agent_link_status not null default 'pending',
  proposal_message text,
  collaboration_terms text,
  owner_contact_visible boolean not null default false,
  proposed_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, agent_id)
);

create table if not exists public.room_agent_markups (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  markup_percent numeric(5, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, agent_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  creator_role public.app_role not null,
  slug text not null unique,
  title text not null,
  guest_label text,
  is_archived boolean not null default false,
  views_count integer not null default 0,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint collection_items_target_check check (
    (property_id is not null and room_id is null)
    or (property_id is null and room_id is not null)
  )
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_context public.app_role not null,
  status public.subscription_status not null default 'trial',
  plan_name text not null default 'MVP',
  active_room_limit integer,
  trial_ends_at timestamptz,
  grace_ends_at timestamptz,
  paid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, role_context)
);

create table if not exists public.guest_requests (
  id uuid primary key default gen_random_uuid(),
  source public.request_source not null default 'owner',
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.profiles(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  guest_comment text,
  adults_count integer not null default 1,
  children_count integer not null default 0,
  check_in date not null,
  check_out date not null,
  status public.request_status not null default 'new',
  transferred_to_owner_at timestamptz,
  owner_confirmed_at timestamptz,
  completion_requested_at timestamptz,
  completed_at timestamptz,
  base_price_per_night numeric(12, 2),
  agent_markup_percent numeric(5, 2),
  total_price numeric(12, 2),
  pricing_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint guest_requests_dates_check check (check_in < check_out)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists properties_owner_id_idx on public.properties(owner_id);
create index if not exists rooms_property_id_idx on public.rooms(property_id);
create index if not exists guest_requests_owner_id_idx on public.guest_requests(owner_id);
create index if not exists guest_requests_agent_id_idx on public.guest_requests(agent_id);
create index if not exists guest_requests_room_id_idx on public.guest_requests(room_id);
create index if not exists guest_requests_created_at_idx on public.guest_requests(created_at desc);
create index if not exists agent_property_links_owner_id_idx on public.agent_property_links(owner_id);
create index if not exists agent_property_links_agent_id_idx on public.agent_property_links(agent_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.properties enable row level security;
alter table public.property_features enable row level security;
alter table public.property_rules enable row level security;
alter table public.rooms enable row level security;
alter table public.room_amenities enable row level security;
alter table public.room_seasonal_prices enable row level security;
alter table public.room_busy_ranges enable row level security;
alter table public.agent_property_links enable row level security;
alter table public.room_agent_markups enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.guest_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = public.current_profile_id());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = public.current_profile_id())
with check (id = public.current_profile_id());

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (profile_id = public.current_profile_id());

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
on public.properties
for select
to public
using (published = true and is_frozen = false);

drop policy if exists "properties_owner_manage" on public.properties;
create policy "properties_owner_manage"
on public.properties
for all
to authenticated
using (owner_id = public.current_profile_id())
with check (owner_id = public.current_profile_id());

drop policy if exists "properties_agent_read_active_links" on public.properties;
create policy "properties_agent_read_active_links"
on public.properties
for select
to authenticated
using (
  exists (
    select 1
    from public.agent_property_links apl
    where apl.property_id = properties.id
      and apl.agent_id = public.current_profile_id()
      and apl.status = 'active'
  )
);

drop policy if exists "property_features_public_read" on public.property_features;
create policy "property_features_public_read"
on public.property_features
for select
to public
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_features.property_id
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "property_rules_public_read" on public.property_rules;
create policy "property_rules_public_read"
on public.property_rules
for select
to public
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_rules.property_id
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "rooms_public_read" on public.rooms;
create policy "rooms_public_read"
on public.rooms
for select
to public
using (
  is_active = true
  and exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "rooms_owner_manage" on public.rooms;
create policy "rooms_owner_manage"
on public.rooms
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = public.current_profile_id()
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
    join public.properties p on p.id = r.property_id
    where r.id = room_amenities.room_id
      and r.is_active = true
      and p.published = true
      and p.is_frozen = false
  )
);

drop policy if exists "room_seasonal_prices_owner_read" on public.room_seasonal_prices;
create policy "room_seasonal_prices_owner_read"
on public.room_seasonal_prices
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_seasonal_prices.room_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_busy_ranges_property_access" on public.room_busy_ranges;
create policy "room_busy_ranges_property_access"
on public.room_busy_ranges
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    left join public.agent_property_links apl on apl.property_id = p.id and apl.agent_id = public.current_profile_id() and apl.status = 'active'
    where r.id = room_busy_ranges.room_id
      and (
        p.owner_id = public.current_profile_id()
        or apl.id is not null
      )
  )
);

drop policy if exists "agent_links_owner_or_agent" on public.agent_property_links;
create policy "agent_links_owner_or_agent"
on public.agent_property_links
for select
to authenticated
using (
  owner_id = public.current_profile_id()
  or agent_id = public.current_profile_id()
);

drop policy if exists "agent_links_insert_agent" on public.agent_property_links;
create policy "agent_links_insert_agent"
on public.agent_property_links
for insert
to authenticated
with check (agent_id = public.current_profile_id());

drop policy if exists "agent_links_update_owner" on public.agent_property_links;
create policy "agent_links_update_owner"
on public.agent_property_links
for update
to authenticated
using (owner_id = public.current_profile_id() or agent_id = public.current_profile_id())
with check (owner_id = public.current_profile_id() or agent_id = public.current_profile_id());

drop policy if exists "room_agent_markups_owner_or_agent" on public.room_agent_markups;
create policy "room_agent_markups_owner_or_agent"
on public.room_agent_markups
for select
to authenticated
using (
  agent_id = public.current_profile_id()
  or exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    where r.id = room_agent_markups.room_id
      and p.owner_id = public.current_profile_id()
  )
);

drop policy if exists "collections_creator_manage" on public.collections;
create policy "collections_creator_manage"
on public.collections
for all
to authenticated
using (creator_id = public.current_profile_id())
with check (creator_id = public.current_profile_id());

drop policy if exists "collection_items_creator_manage" on public.collection_items;
create policy "collection_items_creator_manage"
on public.collection_items
for all
to authenticated
using (
  exists (
    select 1
    from public.collections c
    where c.id = collection_items.collection_id
      and c.creator_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.collections c
    where c.id = collection_items.collection_id
      and c.creator_id = public.current_profile_id()
  )
);

drop policy if exists "subscriptions_own_read" on public.subscriptions;
create policy "subscriptions_own_read"
on public.subscriptions
for select
to authenticated
using (profile_id = public.current_profile_id());

drop policy if exists "guest_requests_owner_or_agent_read" on public.guest_requests;
create policy "guest_requests_owner_or_agent_read"
on public.guest_requests
for select
to authenticated
using (
  owner_id = public.current_profile_id()
  or agent_id = public.current_profile_id()
);

drop policy if exists "guest_requests_owner_or_agent_update" on public.guest_requests;
create policy "guest_requests_owner_or_agent_update"
on public.guest_requests
for update
to authenticated
using (
  owner_id = public.current_profile_id()
  or agent_id = public.current_profile_id()
)
with check (
  owner_id = public.current_profile_id()
  or agent_id = public.current_profile_id()
);

drop policy if exists "notifications_own_read" on public.notifications;
create policy "notifications_own_read"
on public.notifications
for select
to authenticated
using (recipient_id = public.current_profile_id());

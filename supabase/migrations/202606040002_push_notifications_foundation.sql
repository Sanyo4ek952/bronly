create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  telegram_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
  status text not null,
  provider_message_id text,
  error_code text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_profile_id_idx
  on public.push_subscriptions(profile_id, updated_at desc);

create index if not exists notification_deliveries_recipient_created_idx
  on public.notification_deliveries(recipient_id, created_at desc);

create index if not exists notification_deliveries_notification_idx
  on public.notification_deliveries(notification_id, channel);

alter table public.push_subscriptions enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "push_subscriptions_own_select" on public.push_subscriptions;
create policy "push_subscriptions_own_select"
on public.push_subscriptions
for select
to authenticated
using (profile_id = public.current_profile_id());

drop policy if exists "push_subscriptions_own_insert" on public.push_subscriptions;
create policy "push_subscriptions_own_insert"
on public.push_subscriptions
for insert
to authenticated
with check (profile_id = public.current_profile_id());

drop policy if exists "push_subscriptions_own_update" on public.push_subscriptions;
create policy "push_subscriptions_own_update"
on public.push_subscriptions
for update
to authenticated
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

drop policy if exists "push_subscriptions_own_delete" on public.push_subscriptions;
create policy "push_subscriptions_own_delete"
on public.push_subscriptions
for delete
to authenticated
using (profile_id = public.current_profile_id());

drop policy if exists "notification_settings_own_select" on public.notification_settings;
create policy "notification_settings_own_select"
on public.notification_settings
for select
to authenticated
using (profile_id = public.current_profile_id());

drop policy if exists "notification_settings_own_insert" on public.notification_settings;
create policy "notification_settings_own_insert"
on public.notification_settings
for insert
to authenticated
with check (profile_id = public.current_profile_id());

drop policy if exists "notification_settings_own_update" on public.notification_settings;
create policy "notification_settings_own_update"
on public.notification_settings
for update
to authenticated
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

drop policy if exists "notification_deliveries_own_select" on public.notification_deliveries;
create policy "notification_deliveries_own_select"
on public.notification_deliveries
for select
to authenticated
using (recipient_id = public.current_profile_id());

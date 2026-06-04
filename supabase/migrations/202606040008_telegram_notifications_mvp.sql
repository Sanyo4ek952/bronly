create table if not exists public.telegram_notification_connections (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  telegram_chat_id text unique,
  telegram_user_id text,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  link_token_hash text,
  link_token_expires_at timestamptz,
  linked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists telegram_notification_connections_token_idx
  on public.telegram_notification_connections(link_token_hash);

alter table public.notification_deliveries
  add column if not exists telegram_chat_id text;

alter table public.telegram_notification_connections enable row level security;

drop policy if exists "telegram_notification_connections_own_select" on public.telegram_notification_connections;
create policy "telegram_notification_connections_own_select"
on public.telegram_notification_connections
for select
to authenticated
using (profile_id = public.current_profile_id());


create table if not exists public.subscription_audit_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_context public.app_role not null,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check (event_type in ('manual_extension')),
  previous_status public.subscription_status,
  next_status public.subscription_status not null,
  previous_paid_until timestamptz,
  next_paid_until timestamptz,
  extension_days integer check (extension_days is null or extension_days > 0),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscription_audit_events_subscription_created_idx
  on public.subscription_audit_events(subscription_id, created_at desc);

create index if not exists subscription_audit_events_profile_context_created_idx
  on public.subscription_audit_events(profile_id, role_context, created_at desc);

alter table public.subscription_audit_events enable row level security;

revoke all on table public.subscription_audit_events from anon, authenticated;
grant all on table public.subscription_audit_events to service_role;

create or replace function public.admin_extend_subscription(
  p_profile_id uuid,
  p_role_context public.app_role,
  p_actor_profile_id uuid,
  p_extension_days integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row public.subscriptions%rowtype;
  saved_row public.subscriptions%rowtype;
  base_date timestamptz;
  next_paid_until timestamptz;
  audit_event_id uuid;
begin
  if p_role_context not in ('owner', 'agent') then
    raise exception 'unsupported subscription role context';
  end if;

  if p_extension_days < 1 or p_extension_days > 3650 then
    raise exception 'extension days must be between 1 and 3650';
  end if;

  if not exists (
    select 1
    from public.user_roles role_row
    where role_row.profile_id = p_actor_profile_id
      and role_row.role = 'admin'
  ) then
    raise exception 'subscription extension actor must be an administrator';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_profile_id::text || ':' || p_role_context::text, 0));

  select subscription_row.*
  into current_row
  from public.subscriptions subscription_row
  where subscription_row.profile_id = p_profile_id
    and subscription_row.role_context = p_role_context
  for update;

  base_date := greatest(coalesce(current_row.paid_until, timezone('utc', now())), timezone('utc', now()));
  next_paid_until := base_date + make_interval(days => p_extension_days);

  insert into public.subscriptions (
    profile_id,
    role_context,
    status,
    plan_name,
    active_room_limit,
    trial_ends_at,
    grace_ends_at,
    paid_until,
    updated_at
  )
  values (
    p_profile_id,
    p_role_context,
    'active',
    coalesce(current_row.plan_name, 'MVP'),
    current_row.active_room_limit,
    current_row.trial_ends_at,
    null,
    next_paid_until,
    timezone('utc', now())
  )
  on conflict (profile_id, role_context) do update
  set status = 'active',
      grace_ends_at = null,
      paid_until = excluded.paid_until,
      updated_at = excluded.updated_at
  returning * into saved_row;

  insert into public.subscription_audit_events (
    subscription_id,
    profile_id,
    role_context,
    actor_profile_id,
    event_type,
    previous_status,
    next_status,
    previous_paid_until,
    next_paid_until,
    extension_days,
    details
  )
  values (
    saved_row.id,
    p_profile_id,
    p_role_context,
    p_actor_profile_id,
    'manual_extension',
    current_row.status,
    saved_row.status,
    current_row.paid_until,
    saved_row.paid_until,
    p_extension_days,
    jsonb_build_object('source', 'admin_subscription_page')
  )
  returning id into audit_event_id;

  return audit_event_id;
end;
$$;

revoke all on function public.admin_extend_subscription(uuid, public.app_role, uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_extend_subscription(uuid, public.app_role, uuid, integer) to service_role;

create or replace function public.enforce_owner_active_room_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  active_room_count integer;
  configured_limit integer;
  effective_limit integer;
begin
  if not new.is_active or (tg_op = 'UPDATE' and old.is_active and old.owner_id = new.owner_id) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 0));

  select count(*)::integer
  into active_room_count
  from public.rooms room_row
  where room_row.owner_id = new.owner_id
    and room_row.is_active
    and room_row.id is distinct from new.id;

  select subscription_row.active_room_limit
  into configured_limit
  from public.subscriptions subscription_row
  where subscription_row.profile_id = new.owner_id
    and subscription_row.role_context = 'owner';

  if configured_limit is not null then
    effective_limit := configured_limit;
  elsif active_room_count <= 3 then
    effective_limit := 3;
  elsif active_room_count <= 10 then
    effective_limit := 10;
  else
    effective_limit := null;
  end if;

  if effective_limit is not null and active_room_count >= effective_limit then
    raise exception 'active_room_limit_reached'
      using errcode = 'P0001',
            detail = format('profile %s already has %s active rooms for limit %s', new.owner_id, active_room_count, effective_limit);
  end if;

  return new;
end;
$$;

drop trigger if exists rooms_enforce_active_room_limit on public.rooms;
create trigger rooms_enforce_active_room_limit
before insert or update of is_active, owner_id
on public.rooms
for each row
execute function public.enforce_owner_active_room_limit();

alter table public.subscriptions
  add column if not exists room_limit_override integer;

with active_room_counts as (
  select owner_id as profile_id, count(*)::integer as active_room_count
  from public.rooms
  where is_active
  group by owner_id
)
update public.subscriptions subscription_row
set room_limit_override = case
  when greatest(
    coalesce(subscription_row.active_room_limit, 0),
    coalesce(active_room_counts.active_room_count, 0)
  ) > 15
    then greatest(
      coalesce(subscription_row.active_room_limit, 0),
      coalesce(active_room_counts.active_room_count, 0)
    )
  else null
end
from active_room_counts
where subscription_row.profile_id = active_room_counts.profile_id
  and subscription_row.role_context = 'owner';

with agent_active_room_ids as (
  select room_row.owner_id as profile_id, room_row.id as room_id
  from public.rooms room_row
  where room_row.is_active
  union
  select property_link.agent_id as profile_id, room_row.id as room_id
  from public.agent_property_links property_link
  join public.properties property_row on property_row.id = property_link.property_id
  join public.rooms room_row on room_row.property_id = property_row.id
  where property_link.status = 'active'
    and property_row.published
    and not property_row.is_frozen
    and room_row.is_active
  union
  select room_link.agent_id as profile_id, room_row.id as room_id
  from public.agent_room_links room_link
  join public.rooms room_row on room_row.id = room_link.room_id
  where room_link.status = 'active'
    and room_row.is_active
),
agent_active_room_counts as (
  select profile_id, count(*)::integer as active_room_count
  from agent_active_room_ids
  group by profile_id
)
update public.subscriptions subscription_row
set room_limit_override = greatest(
  coalesce(subscription_row.active_room_limit, 0),
  agent_active_room_counts.active_room_count
)
from agent_active_room_counts
where subscription_row.profile_id = agent_active_room_counts.profile_id
  and subscription_row.role_context = 'agent'
  and greatest(
    coalesce(subscription_row.active_room_limit, 0),
    agent_active_room_counts.active_room_count
  ) > 15;

update public.subscriptions
set room_limit_override = active_room_limit
where active_room_limit > 15
  and room_limit_override is null;

alter table public.subscriptions
  add constraint subscriptions_room_limit_override_check
  check (room_limit_override is null or room_limit_override > 15);

update public.subscriptions
set status = 'active'
where status = 'manual';

update public.subscriptions
set trial_ends_at = greatest(
      coalesce(trial_ends_at, created_at + interval '30 days'),
      created_at + interval '30 days'
    ),
    grace_ends_at = greatest(
      coalesce(trial_ends_at, created_at + interval '30 days'),
      created_at + interval '30 days'
    ) + interval '3 days'
where status = 'trial';

update public.subscription_audit_events
set previous_status = 'active'
where previous_status = 'manual';

update public.subscription_audit_events
set next_status = 'active'
where next_status = 'manual';

drop trigger if exists rooms_enforce_active_room_limit on public.rooms;
drop function if exists public.enforce_owner_active_room_limit();

alter table public.subscriptions
  alter column status drop default,
  alter column status type text using status::text;

alter table public.subscription_audit_events
  alter column previous_status type text using previous_status::text,
  alter column next_status type text using next_status::text;

drop type public.subscription_status;

create type public.subscription_status as enum ('trial', 'active', 'grace', 'expired');

alter table public.subscriptions
  alter column status type public.subscription_status using status::public.subscription_status,
  alter column status set default 'trial';

alter table public.subscription_audit_events
  alter column previous_status type public.subscription_status using previous_status::public.subscription_status,
  alter column next_status type public.subscription_status using next_status::public.subscription_status;

alter table public.subscriptions
  drop column plan_name,
  drop column active_room_limit;

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
    room_limit_override,
    trial_ends_at,
    grace_ends_at,
    paid_until,
    updated_at
  )
  values (
    p_profile_id,
    p_role_context,
    'active',
    current_row.room_limit_override,
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

create or replace function public.enforce_owner_room_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  active_room_count integer;
  configured_override integer;
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

  select subscription_row.room_limit_override
  into configured_override
  from public.subscriptions subscription_row
  where subscription_row.profile_id = new.owner_id
    and subscription_row.role_context = 'owner';

  effective_limit := coalesce(configured_override, 15);

  if active_room_count >= effective_limit then
    raise exception 'room_limit_reached'
      using errcode = 'P0001',
            detail = format('profile %s already has %s active rooms for limit %s', new.owner_id, active_room_count, effective_limit);
  end if;

  return new;
end;
$$;

create trigger rooms_enforce_room_limit
before insert or update of is_active, owner_id
on public.rooms
for each row
execute function public.enforce_owner_room_limit();

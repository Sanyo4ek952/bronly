-- One entitlement per profile, with explicit admin operations and immutable payments.

drop trigger if exists rooms_enforce_room_limit on public.rooms;
drop function if exists public.enforce_owner_room_limit();

create or replace function public.profile_active_room_count(p_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from (
    select room_row.id
    from public.rooms room_row
    where room_row.owner_id = p_profile_id
      and room_row.is_active

    union

    select room_row.id
    from public.agent_property_links property_link
    join public.properties property_row on property_row.id = property_link.property_id
    join public.rooms room_row on room_row.property_id = property_row.id
    where property_link.agent_id = p_profile_id
      and property_link.status = 'active'
      and property_row.published
      and not property_row.is_frozen
      and room_row.is_active

    union

    select room_row.id
    from public.agent_room_links room_link
    join public.rooms room_row on room_row.id = room_link.room_id
    where room_link.agent_id = p_profile_id
      and room_link.status = 'active'
      and room_row.is_active
  ) active_room_ids;
$$;

revoke all on function public.profile_active_room_count(uuid) from public, anon, authenticated;
grant execute on function public.profile_active_room_count(uuid) to service_role;

-- Preserve every existing effective limit before the owner/agent rows are merged.
update public.subscriptions subscription_row
set room_limit_override = greatest(
  coalesce(subscription_row.room_limit_override, 0),
  public.profile_active_room_count(subscription_row.profile_id)
)
where greatest(
  coalesce(subscription_row.room_limit_override, 0),
  public.profile_active_room_count(subscription_row.profile_id)
) > 15;

create temporary table subscription_merge_map on commit drop as
select
  subscription_row.id as source_id,
  first_value(subscription_row.id) over (
    partition by subscription_row.profile_id
    order by
      greatest(
        coalesce(subscription_row.paid_until, '-infinity'::timestamptz),
        coalesce(subscription_row.trial_ends_at, '-infinity'::timestamptz),
        coalesce(subscription_row.grace_ends_at, '-infinity'::timestamptz)
      ) desc,
      subscription_row.updated_at desc,
      subscription_row.id
  ) as target_id,
  subscription_row.role_context
from public.subscriptions subscription_row;

update public.subscription_audit_events audit_row
set subscription_id = merge_row.target_id,
    details = audit_row.details || jsonb_build_object('legacy_role_context', merge_row.role_context)
from subscription_merge_map merge_row
where audit_row.subscription_id = merge_row.source_id;

with merged as (
  select
    subscription_row.profile_id,
    max(subscription_row.paid_until) as paid_until,
    max(subscription_row.trial_ends_at) as trial_ends_at,
    max(subscription_row.grace_ends_at) as stored_grace_ends_at,
    max(subscription_row.room_limit_override) as room_limit_override,
    min(subscription_row.created_at) as created_at,
    max(subscription_row.updated_at) as updated_at
  from public.subscriptions subscription_row
  group by subscription_row.profile_id
), normalized as (
  select
    merged.*,
    greatest(
      merged.stored_grace_ends_at,
      merged.paid_until + interval '3 days',
      merged.trial_ends_at + interval '3 days'
    ) as grace_ends_at
  from merged
)
update public.subscriptions target
set paid_until = normalized.paid_until,
    trial_ends_at = normalized.trial_ends_at,
    grace_ends_at = normalized.grace_ends_at,
    room_limit_override = normalized.room_limit_override,
    created_at = normalized.created_at,
    updated_at = normalized.updated_at,
    status = case
      when normalized.paid_until >= timezone('utc', now()) then 'active'::public.subscription_status
      when normalized.trial_ends_at >= timezone('utc', now()) then 'trial'::public.subscription_status
      when normalized.grace_ends_at >= timezone('utc', now()) then 'grace'::public.subscription_status
      else 'expired'::public.subscription_status
    end
from normalized
where target.profile_id = normalized.profile_id
  and target.id = (
    select merge_row.target_id
    from subscription_merge_map merge_row
    where merge_row.source_id = target.id
  );

delete from public.subscriptions subscription_row
using subscription_merge_map merge_row
where subscription_row.id = merge_row.source_id
  and merge_row.source_id <> merge_row.target_id;

drop index if exists public.subscription_audit_events_profile_context_created_idx;

alter table public.subscription_audit_events
  drop column role_context;

alter table public.subscriptions
  drop constraint if exists subscriptions_profile_id_role_context_key,
  drop column role_context,
  add constraint subscriptions_profile_id_key unique (profile_id);

create index if not exists subscription_audit_events_profile_created_idx
  on public.subscription_audit_events(profile_id, created_at desc);

alter table public.subscription_audit_events
  drop constraint if exists subscription_audit_events_event_type_check;

update public.subscription_audit_events
set event_type = 'free_extension',
    details = details || jsonb_build_object('source', coalesce(details->>'source', 'legacy_admin_extension'))
where event_type = 'manual_extension';

alter table public.subscription_audit_events
  add constraint subscription_audit_events_event_type_check check (
    event_type in ('trial_started', 'payment_recorded', 'free_extension', 'room_limit_changed', 'access_ended')
  );

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  billing_period text not null check (billing_period in ('month', 'year')),
  amount_kopecks integer not null check (
    (billing_period = 'month' and amount_kopecks = 49000)
    or (billing_period = 'year' and amount_kopecks = 449000)
  ),
  currency text not null default 'RUB' check (currency = 'RUB'),
  payment_method text not null check (payment_method in ('bank_transfer', 'cash', 'other')),
  paid_at timestamptz not null,
  external_reference text,
  note text,
  recorded_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key uuid not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index payments_subscription_paid_at_idx on public.payments(subscription_id, paid_at desc);
create index payments_profile_paid_at_idx on public.payments(profile_id, paid_at desc);
create index payments_recorded_by_profile_idx on public.payments(recorded_by_profile_id);

alter table public.payments enable row level security;
revoke all on table public.payments from anon, authenticated;
grant all on table public.payments to service_role;

alter table public.referral_rewards
  add column applied_subscription_id uuid references public.subscriptions(id) on delete restrict;

update public.referral_rewards reward_row
set applied_subscription_id = subscription_row.id
from public.subscriptions subscription_row
where reward_row.inviter_profile_id = subscription_row.profile_id
  and reward_row.approval_status = 'approved';

alter table public.referral_rewards
  drop column applied_role_contexts;

create index referral_rewards_applied_subscription_idx
  on public.referral_rewards(applied_subscription_id)
  where applied_subscription_id is not null;

create or replace function public.admin_start_subscription_trial(
  p_profile_id uuid,
  p_actor_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_row public.subscriptions%rowtype;
  audit_event_id uuid;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'subscription actor must be an administrator';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('subscription:' || p_profile_id::text, 0));

  if exists (select 1 from public.subscriptions where profile_id = p_profile_id) then
    raise exception 'subscription_already_exists';
  end if;

  insert into public.subscriptions (profile_id, status, trial_ends_at, grace_ends_at)
  values (
    p_profile_id,
    'trial',
    timezone('utc', now()) + interval '30 days',
    timezone('utc', now()) + interval '33 days'
  )
  returning * into saved_row;

  insert into public.subscription_audit_events (
    subscription_id, profile_id, actor_profile_id, event_type,
    previous_status, next_status, details
  ) values (
    saved_row.id, p_profile_id, p_actor_profile_id, 'trial_started',
    null, 'trial', jsonb_build_object('source', 'admin_subscription_page')
  ) returning id into audit_event_id;

  return audit_event_id;
end;
$$;

revoke all on function public.admin_start_subscription_trial(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_start_subscription_trial(uuid, uuid) to service_role;

create or replace function public.admin_record_subscription_payment(
  p_profile_id uuid,
  p_actor_profile_id uuid,
  p_billing_period text,
  p_payment_method text,
  p_paid_at timestamptz,
  p_external_reference text,
  p_note text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.subscriptions%rowtype;
  saved_row public.subscriptions%rowtype;
  payment_id uuid;
  period_days integer;
  payment_amount integer;
  base_date timestamptz;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'subscription actor must be an administrator';
  end if;

  if p_billing_period = 'month' then
    period_days := 30;
    payment_amount := 49000;
  elsif p_billing_period = 'year' then
    period_days := 365;
    payment_amount := 449000;
  else
    raise exception 'unsupported_billing_period';
  end if;

  if p_payment_method not in ('bank_transfer', 'cash', 'other') then
    raise exception 'unsupported_payment_method';
  end if;

  select id into payment_id from public.payments where idempotency_key = p_idempotency_key;
  if found then
    return payment_id;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('subscription:' || p_profile_id::text, 0));
  select * into current_row from public.subscriptions where profile_id = p_profile_id for update;

  base_date := greatest(coalesce(current_row.paid_until, timezone('utc', now())), timezone('utc', now()));

  insert into public.subscriptions (profile_id, status, trial_ends_at, paid_until, grace_ends_at, updated_at)
  values (
    p_profile_id, 'active', current_row.trial_ends_at,
    base_date + make_interval(days => period_days), null, timezone('utc', now())
  )
  on conflict (profile_id) do update
  set status = 'active',
      paid_until = excluded.paid_until,
      grace_ends_at = null,
      updated_at = excluded.updated_at
  returning * into saved_row;

  insert into public.payments (
    subscription_id, profile_id, billing_period, amount_kopecks,
    payment_method, paid_at, external_reference, note,
    recorded_by_profile_id, idempotency_key
  ) values (
    saved_row.id, p_profile_id, p_billing_period, payment_amount,
    p_payment_method, coalesce(p_paid_at, timezone('utc', now())),
    nullif(trim(p_external_reference), ''), nullif(trim(p_note), ''),
    p_actor_profile_id, p_idempotency_key
  ) returning id into payment_id;

  insert into public.subscription_audit_events (
    subscription_id, profile_id, actor_profile_id, event_type,
    previous_status, next_status, previous_paid_until, next_paid_until,
    extension_days, details
  ) values (
    saved_row.id, p_profile_id, p_actor_profile_id, 'payment_recorded',
    current_row.status, saved_row.status, current_row.paid_until, saved_row.paid_until,
    period_days, jsonb_build_object('payment_id', payment_id, 'billing_period', p_billing_period)
  );

  return payment_id;
end;
$$;

revoke all on function public.admin_record_subscription_payment(uuid, uuid, text, text, timestamptz, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_record_subscription_payment(uuid, uuid, text, text, timestamptz, text, text, uuid) to service_role;

create or replace function public.admin_grant_subscription_extension(
  p_profile_id uuid,
  p_actor_profile_id uuid,
  p_extension_days integer,
  p_reason text,
  p_source text default 'admin_subscription_page'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.subscriptions%rowtype;
  saved_row public.subscriptions%rowtype;
  audit_event_id uuid;
  base_date timestamptz;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'subscription actor must be an administrator';
  end if;
  if p_extension_days < 1 or p_extension_days > 3650 then
    raise exception 'extension_days_out_of_range';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'extension_reason_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('subscription:' || p_profile_id::text, 0));
  select * into current_row from public.subscriptions where profile_id = p_profile_id for update;
  base_date := greatest(coalesce(current_row.paid_until, timezone('utc', now())), timezone('utc', now()));

  insert into public.subscriptions (profile_id, status, trial_ends_at, paid_until, grace_ends_at, updated_at)
  values (
    p_profile_id, 'active', current_row.trial_ends_at,
    base_date + make_interval(days => p_extension_days), null, timezone('utc', now())
  )
  on conflict (profile_id) do update
  set status = 'active', paid_until = excluded.paid_until,
      grace_ends_at = null, updated_at = excluded.updated_at
  returning * into saved_row;

  insert into public.subscription_audit_events (
    subscription_id, profile_id, actor_profile_id, event_type,
    previous_status, next_status, previous_paid_until, next_paid_until,
    extension_days, details
  ) values (
    saved_row.id, p_profile_id, p_actor_profile_id, 'free_extension',
    current_row.status, saved_row.status, current_row.paid_until, saved_row.paid_until,
    p_extension_days, jsonb_build_object('source', p_source, 'reason', trim(p_reason))
  ) returning id into audit_event_id;

  return audit_event_id;
end;
$$;

revoke all on function public.admin_grant_subscription_extension(uuid, uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.admin_grant_subscription_extension(uuid, uuid, integer, text, text) to service_role;

create or replace function public.admin_set_subscription_room_limit(
  p_profile_id uuid,
  p_actor_profile_id uuid,
  p_room_limit_override integer,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.subscriptions%rowtype;
  saved_row public.subscriptions%rowtype;
  current_count integer;
  audit_event_id uuid;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'subscription actor must be an administrator';
  end if;
  if p_room_limit_override is not null and p_room_limit_override <= 15 then
    raise exception 'room_limit_override_must_exceed_default';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'room_limit_reason_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('subscription:' || p_profile_id::text, 0));
  current_count := public.profile_active_room_count(p_profile_id);
  if coalesce(p_room_limit_override, 15) < current_count then
    raise exception 'room_limit_below_current_usage';
  end if;

  select * into current_row from public.subscriptions where profile_id = p_profile_id for update;
  if not found then
    raise exception 'subscription_not_found';
  end if;

  update public.subscriptions
  set room_limit_override = p_room_limit_override, updated_at = timezone('utc', now())
  where profile_id = p_profile_id
  returning * into saved_row;

  insert into public.subscription_audit_events (
    subscription_id, profile_id, actor_profile_id, event_type,
    previous_status, next_status, details
  ) values (
    saved_row.id, p_profile_id, p_actor_profile_id, 'room_limit_changed',
    current_row.status, saved_row.status,
    jsonb_build_object(
      'reason', trim(p_reason),
      'previous_room_limit_override', current_row.room_limit_override,
      'next_room_limit_override', saved_row.room_limit_override
    )
  ) returning id into audit_event_id;

  return audit_event_id;
end;
$$;

revoke all on function public.admin_set_subscription_room_limit(uuid, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.admin_set_subscription_room_limit(uuid, uuid, integer, text) to service_role;

create or replace function public.admin_end_subscription_access(
  p_profile_id uuid,
  p_actor_profile_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.subscriptions%rowtype;
  saved_row public.subscriptions%rowtype;
  audit_event_id uuid;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'subscription actor must be an administrator';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'access_end_reason_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('subscription:' || p_profile_id::text, 0));
  select * into current_row from public.subscriptions where profile_id = p_profile_id for update;
  if not found then
    raise exception 'subscription_not_found';
  end if;

  update public.subscriptions
  set status = 'expired', trial_ends_at = null, paid_until = null,
      grace_ends_at = null, updated_at = timezone('utc', now())
  where profile_id = p_profile_id
  returning * into saved_row;

  insert into public.subscription_audit_events (
    subscription_id, profile_id, actor_profile_id, event_type,
    previous_status, next_status, previous_paid_until, next_paid_until, details
  ) values (
    saved_row.id, p_profile_id, p_actor_profile_id, 'access_ended',
    current_row.status, saved_row.status, current_row.paid_until, null,
    jsonb_build_object('reason', trim(p_reason))
  ) returning id into audit_event_id;

  return audit_event_id;
end;
$$;

revoke all on function public.admin_end_subscription_access(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_end_subscription_access(uuid, uuid, text) to service_role;

-- Compatibility for an in-flight application deploy; the role argument is intentionally ignored.
create or replace function public.admin_extend_subscription(
  p_profile_id uuid,
  p_role_context public.app_role,
  p_actor_profile_id uuid,
  p_extension_days integer default 30
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select public.admin_grant_subscription_extension(
    p_profile_id,
    p_actor_profile_id,
    p_extension_days,
    'Совместимое ручное продление',
    'legacy_admin_extension'
  );
$$;

revoke all on function public.admin_extend_subscription(uuid, public.app_role, uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_extend_subscription(uuid, public.app_role, uuid, integer) to service_role;

create or replace function public.admin_review_referral_reward(
  p_reward_id uuid,
  p_decision public.referral_approval_status,
  p_actor_profile_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  reward_row public.referral_rewards%rowtype;
  subscription_id uuid;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'referral decision must be approved or rejected';
  end if;
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'referral decision actor must be an administrator';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('referral-review:' || p_reward_id::text, 0));
  select * into reward_row from public.referral_rewards where id = p_reward_id for update;

  if not found then return 'not_found'; end if;
  if reward_row.approval_status <> 'pending' then
    if reward_row.approval_status = p_decision then
      return 'already_' || p_decision::text;
    end if;
    return 'conflict_' || reward_row.approval_status::text;
  end if;

  if p_decision = 'rejected' then
    update public.referral_rewards
    set approval_status = 'rejected', approved_by_admin_id = p_actor_profile_id,
        rejected_at = timezone('utc', now()), approved_at = null,
        applied_subscription_id = null,
        updated_at = timezone('utc', now())
    where id = reward_row.id;
    return 'rejected';
  end if;

  perform public.admin_grant_subscription_extension(
    reward_row.inviter_profile_id,
    p_actor_profile_id,
    10,
    'Реферальный бонус',
    'referral_reward:' || reward_row.id::text
  );

  select id into subscription_id
  from public.subscriptions
  where profile_id = reward_row.inviter_profile_id;

  update public.referral_rewards
  set approval_status = 'approved', reward_days = 10,
      approved_by_admin_id = p_actor_profile_id,
      approved_at = timezone('utc', now()), rejected_at = null,
      applied_subscription_id = subscription_id,
      updated_at = timezone('utc', now())
  where id = reward_row.id;

  return 'approved';
end;
$$;

revoke all on function public.admin_review_referral_reward(uuid, public.referral_approval_status, uuid) from public, anon, authenticated;
grant execute on function public.admin_review_referral_reward(uuid, public.referral_approval_status, uuid) to service_role;

create or replace function public.assert_profile_room_limit(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
  effective_limit integer;
begin
  if p_profile_id is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('room-limit:' || p_profile_id::text, 0));
  active_count := public.profile_active_room_count(p_profile_id);
  select coalesce(room_limit_override, 15)
  into effective_limit
  from public.subscriptions
  where profile_id = p_profile_id;
  effective_limit := coalesce(effective_limit, 15);

  if active_count > effective_limit then
    raise exception 'room_limit_reached'
      using errcode = 'P0001',
            detail = format('profile %s has %s active rooms for limit %s', p_profile_id, active_count, effective_limit);
  end if;
end;
$$;

revoke all on function public.assert_profile_room_limit(uuid) from public, anon, authenticated;
grant execute on function public.assert_profile_room_limit(uuid) to service_role;

create or replace function public.enforce_shared_room_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  impacted_profile_id uuid;
  impacted_property_id uuid;
  impacted_room_id uuid;
begin
  if tg_table_name = 'rooms' then
    if tg_op <> 'DELETE' then
      perform public.assert_profile_room_limit(new.owner_id);
      impacted_property_id := new.property_id;
      impacted_room_id := new.id;
    end if;
    if tg_op <> 'INSERT' then
      perform public.assert_profile_room_limit(old.owner_id);
      impacted_property_id := coalesce(impacted_property_id, old.property_id);
      impacted_room_id := coalesce(impacted_room_id, old.id);
    end if;

    for impacted_profile_id in
      select agent_id from public.agent_property_links
      where property_id = impacted_property_id and status = 'active'
      union
      select agent_id from public.agent_room_links
      where room_id = impacted_room_id and status = 'active'
    loop
      perform public.assert_profile_room_limit(impacted_profile_id);
    end loop;
  elsif tg_table_name = 'properties' then
    impacted_property_id := case when tg_op = 'DELETE' then old.id else new.id end;
    for impacted_profile_id in
      select agent_id from public.agent_property_links
      where property_id = impacted_property_id and status = 'active'
    loop
      perform public.assert_profile_room_limit(impacted_profile_id);
    end loop;
  else
    if tg_op <> 'DELETE' then perform public.assert_profile_room_limit(new.agent_id); end if;
    if tg_op <> 'INSERT' then perform public.assert_profile_room_limit(old.agent_id); end if;
  end if;
  return null;
end;
$$;

drop trigger if exists rooms_enforce_shared_room_limit on public.rooms;
create trigger rooms_enforce_shared_room_limit
after insert or update of is_active, owner_id, property_id or delete on public.rooms
for each row execute function public.enforce_shared_room_limit();

drop trigger if exists properties_enforce_shared_room_limit on public.properties;
create trigger properties_enforce_shared_room_limit
after update of published, is_frozen or delete on public.properties
for each row execute function public.enforce_shared_room_limit();

drop trigger if exists agent_property_links_enforce_shared_room_limit on public.agent_property_links;
create trigger agent_property_links_enforce_shared_room_limit
after insert or update of status, agent_id, property_id or delete on public.agent_property_links
for each row execute function public.enforce_shared_room_limit();

drop trigger if exists agent_room_links_enforce_shared_room_limit on public.agent_room_links;
create trigger agent_room_links_enforce_shared_room_limit
after insert or update of status, agent_id, room_id or delete on public.agent_room_links
for each row execute function public.enforce_shared_room_limit();

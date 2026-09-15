with ranked_active_invites as (
  select
    id,
    row_number() over (
      partition by inviter_profile_id, inviter_role, invitee_role, intent
      order by created_at desc, id desc
    ) as invite_rank
  from public.referral_invites
  where status = 'active'
    and used_by_profile_id is null
)
update public.referral_invites invite_row
set status = 'revoked',
    updated_at = timezone('utc', now())
from ranked_active_invites ranked
where invite_row.id = ranked.id
  and ranked.invite_rank > 1;

create unique index if not exists referral_invites_one_active_per_role_idx
  on public.referral_invites(inviter_profile_id, inviter_role, invitee_role, intent)
  where status = 'active' and used_by_profile_id is null;

create unique index if not exists referral_rewards_invite_id_key
  on public.referral_rewards(invite_id);

alter table public.referral_rewards
  alter column reward_days set default 10;

alter table public.referral_rewards
  drop constraint if exists referral_rewards_reward_days_check;

alter table public.referral_rewards
  add constraint referral_rewards_reward_days_check
  check (reward_days = 10) not valid;

revoke insert, update, delete on table public.user_roles from anon, authenticated;
revoke insert, update, delete on table public.referral_invites from anon, authenticated;
revoke insert, update, delete on table public.referral_rewards from anon, authenticated;

create or replace function public.validate_referral_invite_row()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.inviter_role not in ('owner', 'agent') or new.invitee_role not in ('owner', 'agent') then
    raise exception 'referral invite roles must be owner or agent';
  end if;

  if not exists (
    select 1
    from public.user_roles role_row
    where role_row.profile_id = new.inviter_profile_id
      and role_row.role = new.inviter_role
  ) then
    raise exception 'referral inviter does not have the selected role';
  end if;

  if tg_op = 'UPDATE' and (
    new.inviter_profile_id is distinct from old.inviter_profile_id
    or new.inviter_role is distinct from old.inviter_role
    or new.invitee_role is distinct from old.invitee_role
    or new.intent is distinct from old.intent
    or new.token is distinct from old.token
  ) then
    raise exception 'referral invite identity cannot be changed';
  end if;

  if new.status = 'used' and (new.used_by_profile_id is null or new.used_at is null) then
    raise exception 'used referral invite must identify the invited profile and timestamp';
  end if;

  if new.status <> 'used' and new.used_by_profile_id is not null then
    raise exception 'only a used referral invite can identify the invited profile';
  end if;

  return new;
end;
$$;

drop trigger if exists referral_invites_validate_row on public.referral_invites;
create trigger referral_invites_validate_row
before insert or update on public.referral_invites
for each row
execute function public.validate_referral_invite_row();

create or replace function public.consume_referral_invite(
  p_invite_token text,
  p_invited_profile_id uuid,
  p_invitee_role public.app_role
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  invite_row public.referral_invites%rowtype;
begin
  if p_invitee_role not in ('owner', 'agent') then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('referral-invite:' || p_invite_token, 0));
  perform pg_advisory_xact_lock(hashtextextended('referral-profile:' || p_invited_profile_id::text, 0));

  select candidate.*
  into invite_row
  from public.referral_invites candidate
  where candidate.token = p_invite_token
  for update;

  if not found
    or invite_row.invitee_role <> p_invitee_role
    or invite_row.inviter_profile_id = p_invited_profile_id
    or not exists (
      select 1
      from public.user_roles inviter_role
      where inviter_role.profile_id = invite_row.inviter_profile_id
        and inviter_role.role = invite_row.inviter_role
    )
    or not exists (
      select 1
      from public.user_roles invited_role
      where invited_role.profile_id = p_invited_profile_id
        and invited_role.role = p_invitee_role
    )
  then
    return false;
  end if;

  if invite_row.expires_at is not null and invite_row.expires_at <= timezone('utc', now()) then
    if invite_row.status = 'active' then
      update public.referral_invites
      set status = 'expired',
          updated_at = timezone('utc', now())
      where id = invite_row.id;
    end if;
    return false;
  end if;

  if invite_row.status = 'used' then
    return invite_row.used_by_profile_id = p_invited_profile_id;
  end if;

  if invite_row.status <> 'active'
    or invite_row.used_by_profile_id is not null
    or exists (
      select 1
      from public.referral_invites consumed
      where consumed.used_by_profile_id = p_invited_profile_id
        and consumed.status = 'used'
        and consumed.id <> invite_row.id
    )
  then
    return false;
  end if;

  update public.referral_invites
  set status = 'used',
      used_by_profile_id = p_invited_profile_id,
      used_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = invite_row.id;

  return true;
end;
$$;

revoke all on function public.consume_referral_invite(text, uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.consume_referral_invite(text, uuid, public.app_role) to service_role;

create or replace function public.record_referral_milestone(
  p_invited_profile_id uuid,
  p_milestone_type public.referral_milestone_type
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expected_role public.app_role;
  invite_row public.referral_invites%rowtype;
  saved_reward_id uuid;
begin
  expected_role := case p_milestone_type
    when 'owner_inventory_created' then 'owner'::public.app_role
    when 'agent_first_active_collaboration' then 'agent'::public.app_role
  end;

  if expected_role is null then
    return false;
  end if;

  if p_milestone_type = 'owner_inventory_created' and not (
    exists (
      select 1
      from public.properties property_row
      where property_row.owner_id = p_invited_profile_id
    )
    or exists (
      select 1
      from public.rooms room_row
      where room_row.owner_id = p_invited_profile_id
        and room_row.room_kind = 'standalone_room'
    )
  ) then
    return false;
  end if;

  if p_milestone_type = 'agent_first_active_collaboration' and not (
    exists (
      select 1
      from public.agent_property_links property_link
      where property_link.agent_id = p_invited_profile_id
        and property_link.status = 'active'
    )
    or exists (
      select 1
      from public.agent_room_links room_link
      where room_link.agent_id = p_invited_profile_id
        and room_link.status = 'active'
    )
  ) then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('referral-milestone:' || p_invited_profile_id::text, 0));

  select candidate.*
  into invite_row
  from public.referral_invites candidate
  where candidate.used_by_profile_id = p_invited_profile_id
    and candidate.status = 'used'
    and candidate.invitee_role = expected_role
  order by candidate.used_at desc nulls last, candidate.created_at desc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  insert into public.referral_rewards (
    invite_id,
    inviter_profile_id,
    invited_profile_id,
    milestone_type,
    milestone_reached_at,
    approval_status,
    reward_days,
    applied_role_contexts,
    created_at,
    updated_at
  )
  values (
    invite_row.id,
    invite_row.inviter_profile_id,
    p_invited_profile_id,
    p_milestone_type,
    timezone('utc', now()),
    'pending',
    10,
    '{}'::public.app_role[],
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (invited_profile_id) do nothing
  returning id into saved_reward_id;

  if saved_reward_id is not null then
    return true;
  end if;

  return exists (
    select 1
    from public.referral_rewards reward_row
    where reward_row.invited_profile_id = p_invited_profile_id
      and reward_row.invite_id = invite_row.id
      and reward_row.milestone_type = p_milestone_type
  );
end;
$$;

revoke all on function public.record_referral_milestone(uuid, public.referral_milestone_type) from public, anon, authenticated;
grant execute on function public.record_referral_milestone(uuid, public.referral_milestone_type) to service_role;

create or replace function public.trigger_owner_referral_milestone()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_referral_milestone(new.owner_id, 'owner_inventory_created');
  return new;
end;
$$;

drop trigger if exists properties_record_owner_referral_milestone on public.properties;
create trigger properties_record_owner_referral_milestone
after insert on public.properties
for each row
execute function public.trigger_owner_referral_milestone();

drop trigger if exists standalone_rooms_record_owner_referral_milestone on public.rooms;
create trigger standalone_rooms_record_owner_referral_milestone
after insert on public.rooms
for each row
when (new.room_kind = 'standalone_room')
execute function public.trigger_owner_referral_milestone();

create or replace function public.trigger_agent_referral_milestone()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform public.record_referral_milestone(new.agent_id, 'agent_first_active_collaboration');
  end if;
  return new;
end;
$$;

drop trigger if exists agent_property_links_record_referral_milestone on public.agent_property_links;
create trigger agent_property_links_record_referral_milestone
after insert or update of status on public.agent_property_links
for each row
execute function public.trigger_agent_referral_milestone();

drop trigger if exists agent_room_links_record_referral_milestone on public.agent_room_links;
create trigger agent_room_links_record_referral_milestone
after insert or update of status on public.agent_room_links
for each row
execute function public.trigger_agent_referral_milestone();

create or replace function public.admin_review_referral_reward(
  p_reward_id uuid,
  p_decision public.referral_approval_status,
  p_actor_profile_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reward_row public.referral_rewards%rowtype;
  role_context public.app_role;
  role_contexts public.app_role[];
  audit_event_id uuid;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'referral decision must be approved or rejected';
  end if;

  if not exists (
    select 1
    from public.user_roles role_row
    where role_row.profile_id = p_actor_profile_id
      and role_row.role = 'admin'
  ) then
    raise exception 'referral decision actor must be an administrator';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('referral-review:' || p_reward_id::text, 0));

  select candidate.*
  into reward_row
  from public.referral_rewards candidate
  where candidate.id = p_reward_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if reward_row.approval_status <> 'pending' then
    if reward_row.approval_status = p_decision then
      return 'already_' || p_decision::text;
    end if;
    return 'conflict_' || reward_row.approval_status::text;
  end if;

  if p_decision = 'rejected' then
    update public.referral_rewards
    set approval_status = 'rejected',
        approved_by_admin_id = p_actor_profile_id,
        rejected_at = timezone('utc', now()),
        approved_at = null,
        applied_role_contexts = '{}'::public.app_role[],
        updated_at = timezone('utc', now())
    where id = reward_row.id;

    return 'rejected';
  end if;

  select array_agg(role_row.role order by role_row.role::text)
  into role_contexts
  from public.user_roles role_row
  where role_row.profile_id = reward_row.inviter_profile_id
    and role_row.role in ('owner', 'agent');

  if coalesce(array_length(role_contexts, 1), 0) = 0 then
    raise exception 'referral inviter has no subscription contexts';
  end if;

  foreach role_context in array role_contexts
  loop
    audit_event_id := public.admin_extend_subscription(
      reward_row.inviter_profile_id,
      role_context,
      p_actor_profile_id,
      10
    );

    update public.subscription_audit_events
    set details = jsonb_build_object(
      'source', 'referral_reward',
      'referral_reward_id', reward_row.id
    )
    where id = audit_event_id;
  end loop;

  update public.referral_rewards
  set approval_status = 'approved',
      reward_days = 10,
      approved_by_admin_id = p_actor_profile_id,
      approved_at = timezone('utc', now()),
      rejected_at = null,
      applied_role_contexts = role_contexts,
      updated_at = timezone('utc', now())
  where id = reward_row.id;

  return 'approved';
end;
$$;

revoke all on function public.admin_review_referral_reward(uuid, public.referral_approval_status, uuid) from public, anon, authenticated;
grant execute on function public.admin_review_referral_reward(uuid, public.referral_approval_status, uuid) to service_role;

create or replace function public.admin_set_profile_public_visibility(
  p_profile_id uuid,
  p_hidden boolean,
  p_actor_profile_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_hidden boolean;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'profile visibility actor must be an administrator';
  end if;

  select is_public_hidden_by_admin
  into current_hidden
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if current_hidden = p_hidden then
    return case when p_hidden then 'already_hidden' else 'already_visible' end;
  end if;

  update public.profiles
  set is_public_hidden_by_admin = p_hidden,
      updated_at = timezone('utc', now())
  where id = p_profile_id;

  return case when p_hidden then 'hidden' else 'visible' end;
end;
$$;

revoke all on function public.admin_set_profile_public_visibility(uuid, boolean, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_profile_public_visibility(uuid, boolean, uuid) to service_role;

create or replace function public.admin_set_property_frozen(
  p_property_id uuid,
  p_frozen boolean,
  p_actor_profile_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_frozen boolean;
begin
  if not exists (
    select 1 from public.user_roles
    where profile_id = p_actor_profile_id and role = 'admin'
  ) then
    raise exception 'property freeze actor must be an administrator';
  end if;

  select is_frozen
  into current_frozen
  from public.properties
  where id = p_property_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if current_frozen = p_frozen then
    return case when p_frozen then 'already_frozen' else 'already_unfrozen' end;
  end if;

  update public.properties
  set is_frozen = p_frozen,
      updated_at = timezone('utc', now())
  where id = p_property_id;

  return case when p_frozen then 'frozen' else 'unfrozen' end;
end;
$$;

revoke all on function public.admin_set_property_frozen(uuid, boolean, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_property_frozen(uuid, boolean, uuid) to service_role;

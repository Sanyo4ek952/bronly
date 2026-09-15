begin;

alter table public.profiles
  drop constraint if exists profiles_agent_public_id_format_check;

alter table public.profiles
  add constraint profiles_agent_public_id_format_check
  check (agent_public_id is null or agent_public_id ~ '^ag_[a-z0-9]{6}$');

create or replace function public.ensure_agent_public_id(target_profile_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_public_id text;
  candidate text;
begin
  select profile_row.agent_public_id
  into existing_public_id
  from public.profiles profile_row
  where profile_row.id = target_profile_id
  for update;

  if existing_public_id is not null then
    return existing_public_id;
  end if;

  loop
    candidate := 'ag_' || substring(md5(target_profile_id::text || clock_timestamp()::text || random()::text) from 1 for 6);
    exit when not exists (
      select 1 from public.profiles profile_row where profile_row.agent_public_id = candidate
    );
  end loop;

  update public.profiles
  set agent_public_id = candidate
  where id = target_profile_id;

  return candidate;
end;
$$;

revoke all on function public.ensure_agent_public_id(uuid) from public;

create or replace function public.assign_agent_public_id_for_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'agent' then
    perform public.ensure_agent_public_id(new.profile_id);
  end if;

  return new;
end;
$$;

drop trigger if exists user_roles_assign_agent_public_id on public.user_roles;
create trigger user_roles_assign_agent_public_id
after insert or update of role
on public.user_roles
for each row
execute function public.assign_agent_public_id_for_role();

do $$
declare
  agent_role record;
begin
  for agent_role in
    select role_row.profile_id
    from public.user_roles role_row
    join public.profiles profile_row on profile_row.id = role_row.profile_id
    where role_row.role = 'agent'
      and profile_row.agent_public_id is null
  loop
    perform public.ensure_agent_public_id(agent_role.profile_id);
  end loop;
end;
$$;

create or replace function public.protect_agent_public_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.agent_public_id is distinct from old.agent_public_id then
    raise exception 'Agent public id is managed by the service' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_agent_public_id on public.profiles;
create trigger profiles_protect_agent_public_id
before update of agent_public_id
on public.profiles
for each row
execute function public.protect_agent_public_id();

create or replace function public.enforce_agent_property_link_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_owner_id uuid;
  target_accepts_proposals boolean;
  target_shares_contact boolean;
begin
  select property_row.owner_id, property_row.allow_agent_inquiries, property_row.allow_owner_contact_sharing
  into target_owner_id, target_accepts_proposals, target_shares_contact
  from public.properties property_row
  where property_row.id = new.property_id;

  if target_owner_id is null
    or new.owner_id <> target_owner_id
    or new.agent_id = target_owner_id
    or not exists (
      select 1 from public.user_roles role_row
      where role_row.profile_id = new.agent_id and role_row.role = 'agent'
    ) then
    raise exception 'Invalid property collaboration scope' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if not target_accepts_proposals
      or new.status <> 'pending'
      or new.decided_at is not null
      or new.owner_contact_visible
      or new.collaboration_terms is not null then
      raise exception 'Invalid property proposal payload' using errcode = '42501';
    end if;

    return new;
  end if;

  if new.property_id is distinct from old.property_id
    or new.owner_id is distinct from old.owner_id
    or new.agent_id is distinct from old.agent_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Property collaboration scope is immutable' using errcode = '42501';
  end if;

  if old.status = 'pending' and new.status in ('active', 'declined') then
    if new.proposal_message is distinct from old.proposal_message
      or new.proposed_at is distinct from old.proposed_at
      or new.decided_at is null then
      raise exception 'Invalid property proposal decision' using errcode = '42501';
    end if;

    if new.status = 'active' and new.owner_contact_visible and not target_shares_contact then
      raise exception 'Owner contact sharing is not enabled' using errcode = '42501';
    end if;

    if new.status = 'declined' and new.owner_contact_visible then
      raise exception 'Declined collaboration cannot share owner contact' using errcode = '42501';
    end if;

    return new;
  end if;

  if old.status in ('declined', 'revoked') and new.status = 'pending' then
    if not target_accepts_proposals
      or new.decided_at is not null
      or new.owner_contact_visible
      or new.collaboration_terms is not null then
      raise exception 'Invalid resubmitted property proposal' using errcode = '42501';
    end if;

    return new;
  end if;

  raise exception 'Property collaboration transition is not allowed' using errcode = '42501';
end;
$$;

create or replace function public.enforce_agent_room_link_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_owner_id uuid;
  target_kind text;
  target_accepts_proposals boolean;
  target_shares_contact boolean;
begin
  select room_row.owner_id, room_row.room_kind, room_row.allow_agent_inquiries, room_row.allow_owner_contact_sharing
  into target_owner_id, target_kind, target_accepts_proposals, target_shares_contact
  from public.rooms room_row
  where room_row.id = new.room_id;

  if target_owner_id is null
    or target_kind <> 'standalone_room'
    or new.owner_id <> target_owner_id
    or new.agent_id = target_owner_id
    or not exists (
      select 1 from public.user_roles role_row
      where role_row.profile_id = new.agent_id and role_row.role = 'agent'
    ) then
    raise exception 'Invalid room collaboration scope' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if not target_accepts_proposals
      or new.status <> 'pending'
      or new.decided_at is not null
      or new.owner_contact_visible
      or new.collaboration_terms is not null then
      raise exception 'Invalid room proposal payload' using errcode = '42501';
    end if;

    return new;
  end if;

  if new.room_id is distinct from old.room_id
    or new.owner_id is distinct from old.owner_id
    or new.agent_id is distinct from old.agent_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Room collaboration scope is immutable' using errcode = '42501';
  end if;

  if old.status = 'pending' and new.status in ('active', 'declined') then
    if new.proposal_message is distinct from old.proposal_message
      or new.proposed_at is distinct from old.proposed_at
      or new.decided_at is null then
      raise exception 'Invalid room proposal decision' using errcode = '42501';
    end if;

    if new.status = 'active' and new.owner_contact_visible and not target_shares_contact then
      raise exception 'Owner contact sharing is not enabled' using errcode = '42501';
    end if;

    if new.status = 'declined' and new.owner_contact_visible then
      raise exception 'Declined collaboration cannot share owner contact' using errcode = '42501';
    end if;

    return new;
  end if;

  if old.status in ('declined', 'revoked') and new.status = 'pending' then
    if not target_accepts_proposals
      or new.decided_at is not null
      or new.owner_contact_visible
      or new.collaboration_terms is not null then
      raise exception 'Invalid resubmitted room proposal' using errcode = '42501';
    end if;

    return new;
  end if;

  raise exception 'Room collaboration transition is not allowed' using errcode = '42501';
end;
$$;

drop trigger if exists agent_property_links_enforce_write on public.agent_property_links;
create trigger agent_property_links_enforce_write
before insert or update
on public.agent_property_links
for each row
execute function public.enforce_agent_property_link_write();

drop trigger if exists agent_room_links_enforce_write on public.agent_room_links;
create trigger agent_room_links_enforce_write
before insert or update
on public.agent_room_links
for each row
execute function public.enforce_agent_room_link_write();

drop policy if exists "agent_links_owner_or_agent" on public.agent_property_links;
drop policy if exists "agent_links_insert_agent" on public.agent_property_links;
drop policy if exists "agent_links_update_owner" on public.agent_property_links;
drop policy if exists "agent_property_links_participant_read" on public.agent_property_links;
drop policy if exists "agent_property_links_agent_insert" on public.agent_property_links;
drop policy if exists "agent_property_links_owner_decide" on public.agent_property_links;

create policy "agent_property_links_participant_read"
on public.agent_property_links
for select
to authenticated
using (
  (owner_id = public.current_profile_id() and public.current_profile_has_role('owner'))
  or (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'))
);

create policy "agent_property_links_agent_insert"
on public.agent_property_links
for insert
to authenticated
with check (
  agent_id = public.current_profile_id()
  and public.current_profile_has_role('agent')
  and status = 'pending'
  and decided_at is null
  and not owner_contact_visible
  and collaboration_terms is null
  and exists (
    select 1 from public.properties property_row
    where property_row.id = agent_property_links.property_id
      and property_row.owner_id = agent_property_links.owner_id
      and property_row.owner_id <> public.current_profile_id()
      and property_row.allow_agent_inquiries
  )
);

create policy "agent_property_links_owner_decide"
on public.agent_property_links
for update
to authenticated
using (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and status = 'pending'
)
with check (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and status in ('active', 'declined')
);

drop policy if exists "agent_room_links_owner_or_agent" on public.agent_room_links;
drop policy if exists "agent_room_links_insert_agent" on public.agent_room_links;
drop policy if exists "agent_room_links_update_owner" on public.agent_room_links;
drop policy if exists "agent_room_links_participant_read" on public.agent_room_links;
drop policy if exists "agent_room_links_agent_insert" on public.agent_room_links;
drop policy if exists "agent_room_links_owner_decide" on public.agent_room_links;

create policy "agent_room_links_participant_read"
on public.agent_room_links
for select
to authenticated
using (
  (owner_id = public.current_profile_id() and public.current_profile_has_role('owner'))
  or (agent_id = public.current_profile_id() and public.current_profile_has_role('agent'))
);

create policy "agent_room_links_agent_insert"
on public.agent_room_links
for insert
to authenticated
with check (
  agent_id = public.current_profile_id()
  and public.current_profile_has_role('agent')
  and status = 'pending'
  and decided_at is null
  and not owner_contact_visible
  and collaboration_terms is null
  and exists (
    select 1 from public.rooms room_row
    where room_row.id = agent_room_links.room_id
      and room_row.owner_id = agent_room_links.owner_id
      and room_row.owner_id <> public.current_profile_id()
      and room_row.room_kind = 'standalone_room'
      and room_row.allow_agent_inquiries
  )
);

create policy "agent_room_links_owner_decide"
on public.agent_room_links
for update
to authenticated
using (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and status = 'pending'
)
with check (
  owner_id = public.current_profile_id()
  and public.current_profile_has_role('owner')
  and status in ('active', 'declined')
);

commit;

do $$
begin
  create type public.referral_invite_intent as enum ('join_app', 'collaboration');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.referral_invite_status as enum ('active', 'used', 'revoked', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.referral_milestone_type as enum ('owner_inventory_created', 'agent_first_active_collaboration');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.referral_approval_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.referral_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  inviter_role public.app_role not null,
  invitee_role public.app_role not null,
  intent public.referral_invite_intent not null default 'collaboration',
  target_type text,
  target_id uuid,
  status public.referral_invite_status not null default 'active',
  used_by_profile_id uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint referral_invites_role_check check (inviter_role in ('owner', 'agent') and invitee_role in ('owner', 'agent')),
  constraint referral_invites_target_type_check check (target_type is null or target_type in ('property', 'room'))
);

create index if not exists referral_invites_inviter_profile_idx on public.referral_invites(inviter_profile_id, status, created_at desc);
create index if not exists referral_invites_used_by_profile_idx on public.referral_invites(used_by_profile_id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.referral_invites(id) on delete cascade,
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  milestone_type public.referral_milestone_type not null,
  milestone_reached_at timestamptz not null,
  approval_status public.referral_approval_status not null default 'pending',
  reward_days integer not null default 10,
  approved_by_admin_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  applied_role_contexts public.app_role[] not null default '{}'::public.app_role[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint referral_rewards_reward_days_check check (reward_days > 0)
);

create index if not exists referral_rewards_approval_status_idx on public.referral_rewards(approval_status, milestone_reached_at desc);
create index if not exists referral_rewards_inviter_profile_idx on public.referral_rewards(inviter_profile_id);

alter table public.referral_invites enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "referral_invites_participants_read" on public.referral_invites;
create policy "referral_invites_participants_read"
on public.referral_invites
for select
to authenticated
using (
  inviter_profile_id = public.current_profile_id()
  or used_by_profile_id = public.current_profile_id()
);

drop policy if exists "referral_rewards_participants_read" on public.referral_rewards;
create policy "referral_rewards_participants_read"
on public.referral_rewards
for select
to authenticated
using (
  inviter_profile_id = public.current_profile_id()
  or invited_profile_id = public.current_profile_id()
);

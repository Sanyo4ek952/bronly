\set ON_ERROR_STOP on

begin;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create or replace function pg_temp.assert_count(actual bigint, expected bigint, label text)
returns void
language plpgsql
as $$
begin
  if actual is distinct from expected then
    raise exception '%: expected %, got %', label, expected, actual;
  end if;
end;
$$;

create or replace function pg_temp.assert_text(actual text, expected text, label text)
returns void
language plpgsql
as $$
begin
  if actual is distinct from expected then
    raise exception '%: expected %, got %', label, expected, actual;
  end if;
end;
$$;

create or replace function pg_temp.expect_failure(statement text, label text)
returns void
language plpgsql
as $$
begin
  begin
    execute statement;
  exception when others then
    return;
  end;

  raise exception '%: statement unexpectedly succeeded', label;
end;
$$;

alter table auth.users disable trigger on_auth_user_created;

insert into auth.users (id)
values
  ('14000000-0000-0000-0000-000000000101'),
  ('14000000-0000-0000-0000-000000000102'),
  ('14000000-0000-0000-0000-000000000103'),
  ('14000000-0000-0000-0000-000000000104'),
  ('14000000-0000-0000-0000-000000000105');

alter table auth.users enable trigger on_auth_user_created;

insert into public.profiles (id, auth_user_id, slug, display_name)
values
  ('14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000101', 'referral-inviter', 'Referral Inviter'),
  ('14000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000102', 'referral-owner', 'Invited Owner'),
  ('14000000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000103', 'referral-agent', 'Invited Agent'),
  ('14000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000104', 'referral-admin', 'Referral Admin'),
  ('14000000-0000-0000-0000-000000000005', '14000000-0000-0000-0000-000000000105', 'referral-user', 'Ordinary User');

insert into public.user_roles (profile_id, role)
values
  ('14000000-0000-0000-0000-000000000001', 'owner'),
  ('14000000-0000-0000-0000-000000000001', 'agent'),
  ('14000000-0000-0000-0000-000000000002', 'owner'),
  ('14000000-0000-0000-0000-000000000003', 'agent'),
  ('14000000-0000-0000-0000-000000000004', 'admin'),
  ('14000000-0000-0000-0000-000000000005', 'owner');

insert into public.subscriptions (profile_id, status, paid_until, grace_ends_at)
values
  ('14000000-0000-0000-0000-000000000001', 'expired', '2035-01-01T00:00:00Z', '2034-12-20T00:00:00Z');

insert into public.referral_invites (
  id, token, inviter_profile_id, inviter_role, invitee_role, intent
)
values
  ('14100000-0000-0000-0000-000000000001', 'owner-invite-token', '14000000-0000-0000-0000-000000000001', 'owner', 'owner', 'join_app'),
  ('14100000-0000-0000-0000-000000000002', 'agent-invite-token', '14000000-0000-0000-0000-000000000001', 'agent', 'agent', 'collaboration');

select pg_temp.expect_failure(
  $$insert into public.referral_invites (
      token, inviter_profile_id, inviter_role, invitee_role, intent
    ) values (
      'duplicate-owner-invite',
      '14000000-0000-0000-0000-000000000001',
      'owner',
      'owner',
      'join_app'
    )$$,
  'only one active unused invite exists per inviter and role pair'
);

select pg_temp.assert_text(
  public.consume_referral_invite(
    'owner-invite-token',
    '14000000-0000-0000-0000-000000000002',
    'agent'
  )::text,
  'false',
  'invite cannot be consumed with a substituted role'
);

select pg_temp.assert_text(
  public.consume_referral_invite(
    'owner-invite-token',
    '14000000-0000-0000-0000-000000000002',
    'owner'
  )::text,
  'true',
  'owner invite links the expected owner profile'
);

select pg_temp.assert_text(
  public.consume_referral_invite(
    'owner-invite-token',
    '14000000-0000-0000-0000-000000000002',
    'owner'
  )::text,
  'true',
  'consuming the same invite for the same profile is idempotent'
);

select pg_temp.assert_text(
  public.consume_referral_invite(
    'owner-invite-token',
    '14000000-0000-0000-0000-000000000005',
    'owner'
  )::text,
  'false',
  'used invite cannot be reassigned to another profile'
);

select pg_temp.assert_count(
  (select count(*) from public.referral_rewards),
  0,
  'registration does not create or apply a reward'
);

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address
)
values (
  '14200000-0000-0000-0000-000000000001',
  '14000000-0000-0000-0000-000000000002',
  'invited-owner-property',
  'Invited Owner Property',
  'IOP',
  'hotel',
  'Moscow',
  'Owner Street'
);

select pg_temp.assert_count(
  (select count(*) from public.referral_rewards
    where invited_profile_id = '14000000-0000-0000-0000-000000000002'
      and milestone_type = 'owner_inventory_created'
      and approval_status = 'pending'
      and reward_days = 10),
  1,
  'first owner property creates one pending ten-day reward'
);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, price_per_night,
  property_type, city, address, timezone
)
values (
  '14300000-0000-0000-0000-000000000001',
  null,
  '14000000-0000-0000-0000-000000000002',
  'standalone_room',
  'invited-owner-standalone',
  'Invited Owner Standalone',
  4500,
  'room',
  'Moscow',
  'Standalone Street',
  '(UTC+03:00) Moscow'
);

select pg_temp.assert_count(
  (select count(*) from public.referral_rewards
    where invited_profile_id = '14000000-0000-0000-0000-000000000002'),
  1,
  'later owner inventory does not duplicate the pending reward'
);

select pg_temp.assert_text(
  public.consume_referral_invite(
    'agent-invite-token',
    '14000000-0000-0000-0000-000000000003',
    'agent'
  )::text,
  'true',
  'agent invite links the expected agent profile'
);

select pg_temp.assert_text(
  public.record_referral_milestone(
    '14000000-0000-0000-0000-000000000003',
    'owner_inventory_created'
  )::text,
  'false',
  'agent invite cannot use the owner milestone'
);

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address, allow_agent_inquiries
)
values (
  '14200000-0000-0000-0000-000000000002',
  '14000000-0000-0000-0000-000000000005',
  'referral-agent-target',
  'Referral Agent Target',
  'RAT',
  'hotel',
  'Moscow',
  'Agent Street',
  true
);

insert into public.agent_property_links (
  id, property_id, owner_id, agent_id, status
)
values (
  '14400000-0000-0000-0000-000000000001',
  '14200000-0000-0000-0000-000000000002',
  '14000000-0000-0000-0000-000000000005',
  '14000000-0000-0000-0000-000000000003',
  'pending'
);

update public.agent_property_links
set status = 'active',
    decided_at = timezone('utc', now())
where id = '14400000-0000-0000-0000-000000000001';

select pg_temp.assert_count(
  (select count(*) from public.referral_rewards
    where invited_profile_id = '14000000-0000-0000-0000-000000000003'
      and milestone_type = 'agent_first_active_collaboration'
      and approval_status = 'pending'),
  1,
  'first active agent collaboration creates one pending reward'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000105', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.expect_failure(
  $$insert into public.user_roles (profile_id, role)
    values ('14000000-0000-0000-0000-000000000005', 'admin')$$,
  'ordinary user cannot assign the admin role'
);

select pg_temp.expect_failure(
  $$update public.referral_rewards set approval_status = 'approved'
    where invited_profile_id = '14000000-0000-0000-0000-000000000002'$$,
  'ordinary user cannot mutate referral rewards'
);

select pg_temp.expect_failure(
  $$select public.admin_review_referral_reward(
      '14500000-0000-0000-0000-000000000001',
      'approved',
      '14000000-0000-0000-0000-000000000005'
    )$$,
  'ordinary user cannot execute the referral review function'
);

select pg_temp.expect_failure(
  $$select public.admin_set_profile_public_visibility(
      '14000000-0000-0000-0000-000000000001',
      true,
      '14000000-0000-0000-0000-000000000005'
    )$$,
  'ordinary user cannot execute profile visibility administration'
);

reset role;

select pg_temp.assert_text(
  public.admin_review_referral_reward(
    (select id from public.referral_rewards where invited_profile_id = '14000000-0000-0000-0000-000000000002'),
    'approved',
    '14000000-0000-0000-0000-000000000004'
  ),
  'approved',
  'administrator approves the pending owner reward'
);

select pg_temp.assert_count(
  (select count(*) from public.subscriptions
    where profile_id = '14000000-0000-0000-0000-000000000001'
      and status = 'active'
      and grace_ends_at is null
      and paid_until = '2035-01-11T00:00:00Z'),
  1,
  'approval extends the inviter shared subscription exactly once by ten days'
);

select pg_temp.assert_count(
  (select count(*) from public.subscription_audit_events
    where profile_id = '14000000-0000-0000-0000-000000000001'
      and extension_days = 10
      and details->>'source' like 'referral_reward:%'),
  1,
  'referral approval journals one shared extension'
);

select pg_temp.assert_text(
  public.admin_review_referral_reward(
    (select id from public.referral_rewards where invited_profile_id = '14000000-0000-0000-0000-000000000002'),
    'approved',
    '14000000-0000-0000-0000-000000000004'
  ),
  'already_approved',
  'repeated approval returns an explicit no-op result'
);

select pg_temp.assert_count(
  (select count(*) from public.subscription_audit_events
    where profile_id = '14000000-0000-0000-0000-000000000001'
      and extension_days = 10
      and details->>'source' = 'referral_reward'),
  2,
  'repeated approval does not extend subscriptions again'
);

select pg_temp.assert_text(
  public.admin_review_referral_reward(
    (select id from public.referral_rewards where invited_profile_id = '14000000-0000-0000-0000-000000000003'),
    'rejected',
    '14000000-0000-0000-0000-000000000004'
  ),
  'rejected',
  'administrator can reject a pending reward'
);

select pg_temp.assert_text(
  public.admin_review_referral_reward(
    (select id from public.referral_rewards where invited_profile_id = '14000000-0000-0000-0000-000000000003'),
    'rejected',
    '14000000-0000-0000-0000-000000000004'
  ),
  'already_rejected',
  'repeated rejection returns an explicit no-op result'
);

select pg_temp.assert_text(
  public.admin_set_profile_public_visibility(
    '14000000-0000-0000-0000-000000000001',
    true,
    '14000000-0000-0000-0000-000000000004'
  ),
  'hidden',
  'administrator hides public pages'
);

select pg_temp.assert_text(
  public.admin_set_profile_public_visibility(
    '14000000-0000-0000-0000-000000000001',
    true,
    '14000000-0000-0000-0000-000000000004'
  ),
  'already_hidden',
  'repeated profile hiding is an explicit no-op'
);

select pg_temp.assert_text(
  public.admin_set_property_frozen(
    '14200000-0000-0000-0000-000000000001',
    true,
    '14000000-0000-0000-0000-000000000004'
  ),
  'frozen',
  'administrator freezes a specific object'
);

select pg_temp.assert_text(
  public.admin_set_property_frozen(
    '14200000-0000-0000-0000-000000000001',
    true,
    '14000000-0000-0000-0000-000000000004'
  ),
  'already_frozen',
  'repeated object freezing is an explicit no-op'
);

select pg_temp.assert_count(
  (select count(*) from public.profiles
    where id = '14000000-0000-0000-0000-000000000001'
      and is_public_hidden_by_admin),
  1,
  'profile visibility restriction is persisted'
);

select pg_temp.assert_count(
  (select count(*) from public.properties
    where id = '14200000-0000-0000-0000-000000000001'
      and is_frozen),
  1,
  'object freeze restriction is persisted'
);

rollback;

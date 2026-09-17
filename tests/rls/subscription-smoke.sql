\set ON_ERROR_STOP on

begin;

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

insert into public.profiles (id, slug, display_name)
values
  ('91000000-0000-0000-0000-000000000001', 'subscription-owner', 'Subscription Owner'),
  ('91000000-0000-0000-0000-000000000002', 'subscription-agent', 'Subscription Agent'),
  ('91000000-0000-0000-0000-000000000003', 'subscription-admin', 'Subscription Admin');

insert into public.user_roles (profile_id, role)
values
  ('91000000-0000-0000-0000-000000000001', 'owner'),
  ('91000000-0000-0000-0000-000000000002', 'agent'),
  ('91000000-0000-0000-0000-000000000003', 'admin');

insert into public.subscriptions (
  profile_id,
  role_context,
  status,
  room_limit_override,
  paid_until,
  grace_ends_at
)
values (
  '91000000-0000-0000-0000-000000000001',
  'owner',
  'expired',
  null,
  timezone('utc', now()) - interval '10 days',
  timezone('utc', now()) - interval '7 days'
);

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address
)
values (
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'subscription-property',
  'Subscription Property',
  'SP',
  'hotel',
  'Moscow',
  'Test Street'
);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, price_per_night, is_active
)
values (
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'property_room',
  'first-active-room',
  'First active room',
  5000,
  true
);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, price_per_night, is_active
)
select
  gen_random_uuid(),
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'property_room',
  'active-room-' || room_number,
  'Active room ' || room_number,
  5000,
  true
from generate_series(2, 15) as room_number;

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, price_per_night, is_active,
  property_type, city, address, timezone
)
values (
  '93000000-0000-0000-0000-000000000002',
  null,
  '91000000-0000-0000-0000-000000000001',
  'standalone_room',
  'inactive-standalone-room',
  'Inactive standalone room',
  4000,
  false,
  'room',
  'Moscow',
  'Standalone Street',
  '(UTC+03:00) Moscow'
);

select pg_temp.expect_failure(
  $$update public.rooms
    set is_active = true
    where id = '93000000-0000-0000-0000-000000000002'$$,
  'standalone reactivation cannot exceed the Bronly room limit'
);

select pg_temp.expect_failure(
  $$insert into public.rooms (
      property_id, owner_id, room_kind, slug, title, price_per_night, is_active
    ) values (
      '92000000-0000-0000-0000-000000000001',
      '91000000-0000-0000-0000-000000000001',
      'property_room',
      'second-active-room',
      'Second active room',
      6000,
      true
    )$$,
  'property-room creation cannot exceed the Bronly room limit'
);

select public.admin_extend_subscription(
  '91000000-0000-0000-0000-000000000001',
  'owner',
  '91000000-0000-0000-0000-000000000003',
  30
);

select public.admin_extend_subscription(
  '91000000-0000-0000-0000-000000000002',
  'agent',
  '91000000-0000-0000-0000-000000000003',
  30
);

select pg_temp.assert_count(
  (select count(*) from public.subscriptions where status = 'active' and grace_ends_at is null and profile_id in (
    '91000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000002'
  )),
  2,
  'manual extension activates owner and agent contexts and clears grace'
);

select pg_temp.assert_count(
  (select count(*) from public.subscription_audit_events
    where actor_profile_id = '91000000-0000-0000-0000-000000000003'
      and event_type = 'manual_extension'
      and extension_days = 30),
  2,
  'each manual extension is journaled with its administrator'
);

select pg_temp.assert_count(
  (select count(*) from public.subscription_audit_events
    where next_paid_until > timezone('utc', now()) + interval '29 days'
      and next_paid_until < timezone('utc', now()) + interval '31 days'),
  2,
  'manual extension records the resulting access deadline'
);

rollback;

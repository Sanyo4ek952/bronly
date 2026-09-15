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

create or replace function pg_temp.assert_affected(statement text, expected bigint, label text)
returns void
language plpgsql
as $$
declare
  actual bigint;
begin
  execute statement;
  get diagnostics actual = row_count;
  perform pg_temp.assert_count(actual, expected, label);
end;
$$;

alter table auth.users disable trigger on_auth_user_created;

insert into auth.users (id)
values
  ('10000000-0000-0000-0000-000000000101'),
  ('10000000-0000-0000-0000-000000000102'),
  ('10000000-0000-0000-0000-000000000103');

alter table auth.users enable trigger on_auth_user_created;

insert into public.profiles (id, auth_user_id, slug, display_name)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000101', 'owner-one', 'Owner One'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000102', 'owner-two', 'Owner Two'),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000103', 'agent-one', 'Agent One');

insert into public.user_roles (profile_id, role)
values
  ('10000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000002', 'owner'),
  ('10000000-0000-0000-0000-000000000003', 'agent');

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address
)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'property-one', 'Property One', 'P1', 'hotel', 'Moscow', 'One Street'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'property-two', 'Property Two', 'P2', 'hotel', 'Moscow', 'Two Street');

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, capacity, bedrooms, price_per_night,
  property_type, city, address, timezone
)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'property_room', 'property-room', 'Property Room', 4, 2, 5000, null, null, null, null),
  ('30000000-0000-0000-0000-000000000002', null, '10000000-0000-0000-0000-000000000001', 'standalone_room', 'standalone-room', 'Standalone Room', 3, 1, 4000, 'room', 'Moscow', 'Three Street', '(UTC+03:00) Moscow');

insert into public.room_amenities (id, room_id, label)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Wi-Fi');

insert into public.room_seasonal_prices (id, room_id, starts_on, ends_on, price_per_night)
values ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2030-01-01', '2030-01-02', 4500);

insert into public.room_busy_ranges (id, room_id, starts_on, ends_on)
values ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2030-02-01', '2030-02-02');

alter table public.agent_room_links disable trigger agent_room_links_enforce_write;
insert into public.agent_room_links (id, room_id, owner_id, agent_id, status)
values ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'active');
alter table public.agent_room_links enable trigger agent_room_links_enforce_write;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000101', true);

select pg_temp.assert_affected(
  $$update public.properties set title = 'Property One Updated'
    where id = '20000000-0000-0000-0000-000000000001'$$,
  1,
  'owner updates own property'
);

select pg_temp.assert_affected(
  $$update public.properties set title = 'Forbidden'
    where id = '20000000-0000-0000-0000-000000000002'$$,
  0,
  'owner cannot update another owner property'
);

select pg_temp.assert_affected(
  $$update public.rooms set title = 'Standalone Updated'
    where id = '30000000-0000-0000-0000-000000000002'$$,
  1,
  'owner updates standalone room'
);

select pg_temp.assert_affected(
  $$update public.room_amenities set label = 'Fast Wi-Fi'
    where id = '40000000-0000-0000-0000-000000000001'$$,
  1,
  'owner updates standalone room amenity'
);

select pg_temp.assert_affected(
  $$update public.room_seasonal_prices set price_per_night = 4600
    where id = '50000000-0000-0000-0000-000000000001'$$,
  1,
  'owner updates standalone room seasonal price'
);

select pg_temp.assert_affected(
  $$update public.room_busy_ranges set label = 'Owner block'
    where id = '60000000-0000-0000-0000-000000000001'$$,
  1,
  'owner updates standalone room busy range'
);

select pg_temp.expect_failure(
  $$insert into public.rooms (
      property_id, owner_id, room_kind, slug, title, price_per_night
    ) values (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      'property_room',
      'cross-owner-room',
      'Cross-owner room',
      1000
    )$$,
  'owner cannot attach room to another owner property'
);

reset role;

insert into public.guest_requests (
  id, source, property_id, room_id, owner_id, agent_id,
  guest_name, guest_phone, adults_count, rooms_count, check_in, check_out
)
values
  ('80000000-0000-0000-0000-000000000001', 'owner', null, '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'Direct Guest', '+70000000001', 2, 1, '2030-03-01', '2030-03-03'),
  ('80000000-0000-0000-0000-000000000002', 'agent', null, '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Agent Guest', '+70000000002', 2, 1, '2030-03-04', '2030-03-06');

select pg_temp.expect_failure(
  $$insert into public.guest_requests (
      source, property_id, room_id, owner_id, guest_name, guest_phone,
      adults_count, rooms_count, check_in, check_out
    ) values (
      'owner', null, '30000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000002', 'Wrong Owner', '+70000000003',
      1, 1, '2030-03-07', '2030-03-08'
    )$$,
  'guest request owner must match room owner'
);

select pg_temp.expect_failure(
  $$insert into public.guest_requests (
      source, property_id, room_id, owner_id, guest_name, guest_phone,
      adults_count, rooms_count, check_in, check_out
    ) values (
      'owner', null, '30000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001', 'Too Many Rooms', '+70000000004',
      1, 2, '2030-03-07', '2030-03-08'
    )$$,
  'guest request room count must fit room bedrooms'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000101', true);

select pg_temp.assert_count(
  (select count(*) from public.guest_requests where id = '80000000-0000-0000-0000-000000000001'),
  1,
  'owner sees direct new request'
);

select pg_temp.assert_count(
  (select count(*) from public.guest_requests where id = '80000000-0000-0000-0000-000000000002'),
  0,
  'owner does not see agent request before transfer'
);

select pg_temp.assert_affected(
  $$update public.guest_requests
    set status = 'accepted_by_owner', owner_confirmed_at = now()
    where id = '80000000-0000-0000-0000-000000000001'
  $$,
  1,
  'owner accepts direct request'
);

select pg_temp.assert_affected(
  $$update public.guest_requests set status = 'accepted_by_owner'
    where id = '80000000-0000-0000-0000-000000000002'
  $$,
  0,
  'owner cannot update agent request before transfer'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000103', true);

select pg_temp.assert_count(
  (select count(*) from public.room_busy_ranges where room_id = '30000000-0000-0000-0000-000000000002'),
  1,
  'linked agent reads standalone room busy range'
);

select pg_temp.assert_affected(
  $$update public.rooms set title = 'Agent Forbidden'
    where id = '30000000-0000-0000-0000-000000000002'$$,
  0,
  'agent cannot mutate standalone room'
);

select pg_temp.expect_failure(
  $$update public.guest_requests
    set status = 'completed', completed_at = now()
    where id = '80000000-0000-0000-0000-000000000002'$$,
  'agent cannot complete request'
);

select pg_temp.assert_affected(
  $$update public.guest_requests
    set status = 'transferred_to_owner', transferred_to_owner_at = now()
    where id = '80000000-0000-0000-0000-000000000002'
  $$,
  1,
  'agent transfers request to owner'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000101', true);

select pg_temp.assert_count(
  (select count(*) from public.guest_requests where id = '80000000-0000-0000-0000-000000000002'),
  1,
  'owner sees agent request after transfer'
);

select pg_temp.assert_affected(
  $$update public.guest_requests
    set status = 'accepted_by_owner', owner_confirmed_at = now()
    where id = '80000000-0000-0000-0000-000000000002'
  $$,
  1,
  'owner accepts transferred request'
);

rollback;

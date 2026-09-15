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
  ('11000000-0000-0000-0000-000000000101'),
  ('11000000-0000-0000-0000-000000000102'),
  ('11000000-0000-0000-0000-000000000103');

alter table auth.users enable trigger on_auth_user_created;

insert into public.profiles (id, auth_user_id, slug, display_name)
values
  ('11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000101', 'agent-owner', 'Agent Owner'),
  ('11000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000102', 'agent-other-owner', 'Other Owner'),
  ('11000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000103', 'legacy-agent', 'Agent');

insert into public.user_roles (profile_id, role)
values
  ('11000000-0000-0000-0000-000000000001', 'owner'),
  ('11000000-0000-0000-0000-000000000002', 'owner'),
  ('11000000-0000-0000-0000-000000000003', 'agent');

select pg_temp.assert_count(
  (select count(*) from public.profiles where id = '11000000-0000-0000-0000-000000000003' and agent_public_id ~ '^ag_[a-z0-9]{6}$'),
  1,
  'agent role receives a canonical public id'
);

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address,
  allow_agent_inquiries, allow_owner_contact_sharing, published
)
values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'agent-property', 'Agent Property', 'AP', 'hotel', 'Moscow', 'One Street', true, true, true),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'other-property', 'Other Property', 'OP', 'hotel', 'Moscow', 'Two Street', true, false, true);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, capacity, bedrooms, price_per_night,
  property_type, city, address, timezone, allow_agent_inquiries
)
values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'property_room', 'linked-room', 'Linked Room', 4, 2, 5000, null, null, null, null, false),
  ('31000000-0000-0000-0000-000000000002', null, '11000000-0000-0000-0000-000000000001', 'standalone_room', 'linked-standalone', 'Linked Standalone', 3, 1, 4000, 'room', 'Moscow', 'Three Street', '(UTC+03:00) Moscow', true),
  ('31000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'property_room', 'foreign-room', 'Foreign Room', 2, 1, 3000, null, null, null, null, false);

insert into public.room_busy_ranges (id, room_id, starts_on, ends_on)
values ('41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', '2031-01-10', '2031-01-12');

insert into public.room_photos (id, room_id, storage_path, public_url)
values ('41000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000001', 'agent-smoke/linked-room.jpg', 'https://example.test/linked-room.jpg');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.expect_failure(
  $$update public.profiles set agent_public_id = 'ag_manual' where id = '11000000-0000-0000-0000-000000000003'$$,
  'agent cannot edit the stable public id'
);

insert into public.agent_property_links (
  id, property_id, owner_id, agent_id, status, proposal_message
)
values (
  '51000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000003',
  'pending',
  'Property proposal'
);

insert into public.agent_room_links (
  id, room_id, owner_id, agent_id, status, proposal_message
)
values (
  '51000000-0000-0000-0000-000000000002',
  '31000000-0000-0000-0000-000000000002',
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000003',
  'pending',
  'Room proposal'
);

select pg_temp.expect_failure(
  $$insert into public.agent_property_links (property_id, owner_id, agent_id, status)
    values (
      '21000000-0000-0000-0000-000000000002',
      '11000000-0000-0000-0000-000000000001',
      '11000000-0000-0000-0000-000000000003',
      'pending'
    )$$,
  'agent cannot forge the target owner'
);

select pg_temp.assert_affected(
  $$update public.agent_property_links set status = 'active', decided_at = now()
    where id = '51000000-0000-0000-0000-000000000001'$$,
  0,
  'agent cannot accept their own proposal'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000102', true);

select pg_temp.assert_affected(
  $$update public.agent_property_links set status = 'active', decided_at = now()
    where id = '51000000-0000-0000-0000-000000000001'$$,
  0,
  'another owner cannot decide a proposal'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000101', true);

select pg_temp.assert_affected(
  $$update public.agent_property_links
    set status = 'active', decided_at = now(), owner_contact_visible = true, collaboration_terms = proposal_message
    where id = '51000000-0000-0000-0000-000000000001'$$,
  1,
  'target owner accepts the property proposal'
);

select pg_temp.assert_affected(
  $$update public.agent_room_links
    set status = 'declined', decided_at = now(), collaboration_terms = proposal_message
    where id = '51000000-0000-0000-0000-000000000002'$$,
  1,
  'target owner declines the standalone room proposal'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000103', true);

select pg_temp.assert_count(
  (select count(*) from public.rooms where id = '31000000-0000-0000-0000-000000000001'),
  1,
  'active agent reads a linked property room'
);

select pg_temp.assert_count(
  (select count(*) from public.room_busy_ranges where room_id = '31000000-0000-0000-0000-000000000001'),
  1,
  'active agent reads the linked calendar'
);

select pg_temp.assert_affected(
  $$update public.rooms set title = 'Forbidden title', price_per_night = 1
    where id = '31000000-0000-0000-0000-000000000001'$$,
  0,
  'agent cannot edit the owner room or base price'
);

select pg_temp.assert_affected(
  $$update public.room_busy_ranges set starts_on = '2031-01-01'
    where id = '41000000-0000-0000-0000-000000000001'$$,
  0,
  'agent cannot edit the owner calendar'
);

select pg_temp.assert_affected(
  $$update public.room_photos set public_url = 'https://example.test/forbidden.jpg'
    where id = '41000000-0000-0000-0000-000000000002'$$,
  0,
  'agent cannot edit the owner room photo'
);

insert into public.room_agent_markups (room_id, agent_id, markup_percent)
values ('31000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 15);

select pg_temp.expect_failure(
  $$insert into public.room_agent_markups (room_id, agent_id, markup_percent)
    values ('31000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000003', 15)$$,
  'agent cannot price an unlinked room'
);

reset role;

insert into public.guest_requests (
  id, source, property_id, room_id, owner_id, agent_id,
  guest_name, guest_phone, adults_count, rooms_count, check_in, check_out,
  base_price_per_night, agent_markup_percent, total_price, pricing_snapshot
)
values (
  '61000000-0000-0000-0000-000000000001',
  'agent',
  '21000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000003',
  'Guest',
  '+70000000000',
  2,
  1,
  '2031-02-01',
  '2031-02-03',
  5000,
  15,
  11500,
  '{"source":"agent","base_price_per_night":5000,"display_price_per_night":5750,"total_price":11500,"agent_markup_percent":15}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000103', true);

select pg_temp.expect_failure(
  $$update public.guest_requests set status = 'completed', completed_at = now()
    where id = '61000000-0000-0000-0000-000000000001'$$,
  'agent cannot complete a request'
);

update public.guest_requests
set status = 'transferred_to_owner', transferred_to_owner_at = now()
where id = '61000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000101', true);

update public.guest_requests
set status = 'accepted_by_owner', owner_confirmed_at = now()
where id = '61000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000103', true);

update public.guest_requests
set completion_requested_at = now()
where id = '61000000-0000-0000-0000-000000000001';

select pg_temp.expect_failure(
  $$update public.guest_requests set status = 'completed', completed_at = now()
    where id = '61000000-0000-0000-0000-000000000001'$$,
  'agent still cannot complete after requesting completion'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000101', true);

update public.guest_requests
set status = 'completed', completed_at = now()
where id = '61000000-0000-0000-0000-000000000001';

select pg_temp.assert_count(
  (select count(*) from public.guest_requests
   where id = '61000000-0000-0000-0000-000000000001'
     and status = 'completed'
     and agent_markup_percent = 15
     and total_price = 11500),
  1,
  'owner completes the agent request without changing its price snapshot'
);

rollback;

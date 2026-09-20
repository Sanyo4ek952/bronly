\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.expect_sqlstate(statement text, expected_state text, label text)
returns void
language plpgsql
as $$
declare
  actual_state text;
begin
  begin
    execute statement;
  exception when others then
    get stacked diagnostics actual_state = returned_sqlstate;
    if actual_state is distinct from expected_state then
      raise exception '%: expected SQLSTATE %, got %', label, expected_state, actual_state;
    end if;
    return;
  end;

  raise exception '%: statement unexpectedly succeeded', label;
end;
$$;

insert into public.profiles (id, slug, display_name)
values ('91000000-0000-0000-0000-000000000001', 'calendar-boundary-owner', 'Calendar Boundary Owner');

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address
)
values (
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'calendar-boundary-property',
  'Calendar Boundary Property',
  'Boundary',
  'hotel',
  'Moscow',
  'Boundary Street'
);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, capacity, bedrooms, price_per_night
)
values (
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'property_room',
  'calendar-boundary-room',
  'Calendar Boundary Room',
  2,
  1,
  5000
);

insert into public.room_busy_ranges (id, room_id, starts_on, ends_on)
values
  (
    '94000000-0000-0000-0000-000000000001',
    '93000000-0000-0000-0000-000000000001',
    '2032-09-18',
    '2032-09-21'
  ),
  (
    '94000000-0000-0000-0000-000000000002',
    '93000000-0000-0000-0000-000000000001',
    '2032-09-21',
    '2032-09-27'
  );

select pg_temp.expect_sqlstate(
  $$insert into public.room_busy_ranges (room_id, starts_on, ends_on)
    values ('93000000-0000-0000-0000-000000000001', '2032-09-20', '2032-09-22')$$,
  '23P01',
  'overlapping busy ranges are rejected'
);

select pg_temp.expect_sqlstate(
  $$insert into public.room_busy_ranges (room_id, starts_on, ends_on)
    values ('93000000-0000-0000-0000-000000000001', '2032-10-01', '2032-10-01')$$,
  '23514',
  'zero-night busy ranges are rejected'
);

insert into public.guest_requests (
  source, property_id, room_id, owner_id, guest_name, guest_phone,
  adults_count, rooms_count, check_in, check_out
)
values
  (
    'owner',
    '92000000-0000-0000-0000-000000000001',
    '93000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',
    'Boundary Checkout Guest',
    '+70000000001',
    1,
    1,
    '2032-09-15',
    '2032-09-18'
  ),
  (
    'owner',
    '92000000-0000-0000-0000-000000000001',
    '93000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',
    'Boundary Check-in Guest',
    '+70000000002',
    1,
    1,
    '2032-09-27',
    '2032-09-29'
  );

select pg_temp.expect_sqlstate(
  $$insert into public.guest_requests (
      source, property_id, room_id, owner_id, guest_name, guest_phone,
      adults_count, rooms_count, check_in, check_out
    ) values (
      'owner',
      '92000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000001',
      '91000000-0000-0000-0000-000000000001',
      'Overlapping Guest',
      '+70000000003',
      1,
      1,
      '2032-09-20',
      '2032-09-22'
    )$$,
  '23P01',
  'guest request overlapping an occupied night is rejected'
);

rollback;

\set ON_ERROR_STOP on

begin;

grant usage on schema auth, public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
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

alter table auth.users disable trigger on_auth_user_created;

insert into auth.users (id)
values
  ('12000000-0000-0000-0000-000000000101'),
  ('12000000-0000-0000-0000-000000000102'),
  ('12000000-0000-0000-0000-000000000103');

alter table auth.users enable trigger on_auth_user_created;

insert into public.profiles (id, auth_user_id, slug, display_name)
values
  ('12000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000101', 'collection-owner', 'Owner'),
  ('12000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000102', 'collection-other', 'Other owner'),
  ('12000000-0000-0000-0000-000000000003', '12000000-0000-0000-0000-000000000103', 'collection-agent', 'Agent');

insert into public.user_roles (profile_id, role)
values
  ('12000000-0000-0000-0000-000000000001', 'owner'),
  ('12000000-0000-0000-0000-000000000002', 'owner'),
  ('12000000-0000-0000-0000-000000000003', 'agent');

insert into public.properties (
  id, owner_id, slug, title, short_title, property_type, city, address,
  allow_agent_inquiries, published
)
values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'collection-property', 'Owner property', 'Owner property', 'hotel', 'Moscow', 'One Street', true, true),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'collection-other-property', 'Other property', 'Other property', 'hotel', 'Moscow', 'Two Street', true, true);

insert into public.rooms (
  id, property_id, owner_id, room_kind, slug, title, capacity, bedrooms, price_per_night
)
values
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'property_room', 'collection-room', 'Owner room', 4, 2, 5000),
  ('32000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'property_room', 'collection-other-room', 'Other room', 2, 1, 4000);

insert into public.agent_property_links (
  id, property_id, owner_id, agent_id, status, proposal_message
)
values (
  '52000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000003',
  'pending',
  'Collection collaboration'
);

update public.agent_property_links
set status = 'active', decided_at = now()
where id = '52000000-0000-0000-0000-000000000001';

insert into public.room_agent_markups (room_id, agent_id, markup_percent)
values ('32000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000003', 20);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000101', true);

insert into public.collections (id, creator_id, creator_role, slug, title, guest_label)
values ('62000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'owner', 'owner-collection', 'Internal owner title', 'Для Анны');

insert into public.collection_items (collection_id, property_id)
values ('62000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001');

select pg_temp.expect_failure(
  $$insert into public.collection_items (collection_id, property_id)
    values ('62000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000002')$$,
  'owner cannot add another owner property'
);

select pg_temp.expect_failure(
  $$insert into public.collections (creator_id, creator_role, slug, title)
    values ('12000000-0000-0000-0000-000000000001', 'agent', 'forged-agent-collection', 'Forged')$$,
  'owner cannot create an agent collection'
);

select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000103', true);

insert into public.collections (id, creator_id, creator_role, slug, title, guest_label)
values ('62000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000003', 'agent', 'agent-collection', 'Internal agent title', 'Варианты агента');

insert into public.collection_items (collection_id, property_id)
values ('62000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001');

select pg_temp.expect_failure(
  $$insert into public.collection_items (collection_id, property_id)
    values ('62000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002')$$,
  'agent cannot add an unlinked property'
);

reset role;

select pg_temp.expect_failure(
  $$insert into public.guest_requests (
      source, property_id, room_id, owner_id, agent_id, collection_id,
      guest_name, guest_phone, adults_count, rooms_count, check_in, check_out, agent_markup_percent
    ) values (
      'collection', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000003',
      '62000000-0000-0000-0000-000000000002', 'Guest', '+70000000000', 2, 1, '2032-01-01', '2032-01-03', 5
    )$$,
  'agent collection rejects a forged markup'
);

insert into public.guest_requests (
  id, source, property_id, room_id, owner_id, agent_id, collection_id,
  guest_name, guest_phone, adults_count, rooms_count, check_in, check_out, agent_markup_percent
)
values (
  '72000000-0000-0000-0000-000000000001', 'collection',
  '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000003',
  '62000000-0000-0000-0000-000000000002', 'Guest', '+70000000000', 2, 1,
  '2032-01-01', '2032-01-03', 20
);

select pg_temp.assert_count(
  (select count(*) from public.guest_requests
   where id = '72000000-0000-0000-0000-000000000001'
     and source = 'collection'
     and collection_id = '62000000-0000-0000-0000-000000000002'
     and agent_id = '12000000-0000-0000-0000-000000000003'
     and agent_markup_percent = 20
     and total_price = 12000),
  1,
  'agent collection request keeps source, agent and price snapshot'
);

select pg_temp.assert_count(public.record_collection_open('agent-collection', '82000000-0000-4000-8000-000000000001')::int, 1, 'first session open is counted');
select pg_temp.assert_count(public.record_collection_open('agent-collection', '82000000-0000-4000-8000-000000000001')::int, 0, 'duplicate session open is ignored');
select pg_temp.assert_count((select views_count from public.collections where slug = 'agent-collection'), 1, 'collection counter increments once');
select pg_temp.assert_count((select count(*) from public.collection_events where collection_id = '62000000-0000-0000-0000-000000000002'), 1, 'one event is stored');

update public.collections set is_archived = true where id = '62000000-0000-0000-0000-000000000002';

select pg_temp.expect_failure(
  $$delete from public.collection_items where collection_id = '62000000-0000-0000-0000-000000000002'$$,
  'archived collection items are read only'
);
select pg_temp.assert_count(public.record_collection_open('agent-collection', '82000000-0000-4000-8000-000000000002')::int, 0, 'archived collection does not count opens');

select pg_temp.expect_failure(
  $$insert into public.guest_requests (
      source, property_id, room_id, owner_id, agent_id, collection_id,
      guest_name, guest_phone, adults_count, rooms_count, check_in, check_out, agent_markup_percent
    ) values (
      'collection', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001',
      '12000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000003',
      '62000000-0000-0000-0000-000000000002', 'Guest', '+70000000000', 2, 1, '2032-02-01', '2032-02-03', 20
    )$$,
  'archived collection rejects new requests'
);

rollback;

insert into public.profiles (id, slug, display_name, phone, whatsapp, telegram)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'alina-owner',
    'Алина Иванова',
    '+7 900 123-45-67',
    '+7 900 123-45-67',
    '@bronly_villa'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'nina-agent',
    'Нина Агент',
    '+7 901 000-00-00',
    '+7 901 000-00-00',
    '@nina_agent'
  )
on conflict (id) do nothing;

insert into public.user_roles (profile_id, role)
values
  ('11111111-1111-1111-1111-111111111111', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'agent')
on conflict do nothing;

insert into public.properties (
  id,
  owner_id,
  slug,
  title,
  short_title,
  property_type,
  city,
  address,
  timezone,
  short_description,
  full_description,
  phone,
  whatsapp,
  telegram,
  check_in_time,
  check_out_time,
  published,
  allow_agent_inquiries,
  allow_owner_contact_sharing
)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'dom-u-morya',
  'Вилла у моря',
  'Дом у моря',
  'Вилла / Дом',
  'Геленджик',
  'ул. Набережная, 15',
  '(UTC+03:00) Москва',
  'Уютная вилла на первой линии моря с панорамным видом и просторной террасой.',
  'Просторная вилла с собственным бассейном, террасой и прямым видом на море. К услугам гостей полностью оборудованная кухня, зона отдыха и быстрый Wi-Fi.',
  '+7 900 123-45-67',
  '+7 900 123-45-67',
  '@bronly_villa',
  '15:00',
  '12:00',
  true,
  true,
  true
)
on conflict (id) do nothing;

insert into public.property_features (property_id, label, sort_order)
values
  ('33333333-3333-3333-3333-333333333333', 'Бассейн', 0),
  ('33333333-3333-3333-3333-333333333333', 'Парковка', 1),
  ('33333333-3333-3333-3333-333333333333', 'Wi-Fi', 2),
  ('33333333-3333-3333-3333-333333333333', 'Трансфер', 3),
  ('33333333-3333-3333-3333-333333333333', 'Кухня', 4),
  ('33333333-3333-3333-3333-333333333333', 'Мангал', 5)
on conflict do nothing;

insert into public.property_rules (property_id, label, sort_order)
values
  ('33333333-3333-3333-3333-333333333333', 'Курение запрещено', 0),
  ('33333333-3333-3333-3333-333333333333', 'Нельзя с животными', 1),
  ('33333333-3333-3333-3333-333333333333', 'Тихие часы с 23:00 до 08:00', 2)
on conflict do nothing;

insert into public.rooms (id, property_id, slug, title, subtitle, capacity, bedrooms, area, price_per_night, is_active)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'luxe-sea-view', 'Люкс с видом на море', 'Люкс', 2, 1, 45, 8900, true),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'family-room', 'Семейный номер', 'Семейный', 4, 2, 40, 6200, true),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'standard-balcony', 'Стандарт с балконом', 'Стандарт', 2, 1, 25, 3900, true)
on conflict (id) do nothing;

insert into public.room_amenities (room_id, label, sort_order)
values
  ('44444444-4444-4444-4444-444444444441', 'Wi-Fi', 0),
  ('44444444-4444-4444-4444-444444444441', 'Вид на море', 1),
  ('44444444-4444-4444-4444-444444444441', 'Балкон', 2),
  ('44444444-4444-4444-4444-444444444442', 'Wi-Fi', 0),
  ('44444444-4444-4444-4444-444444444442', '2 спальни', 1),
  ('44444444-4444-4444-4444-444444444442', 'Кухня', 2),
  ('44444444-4444-4444-4444-444444444443', 'Wi-Fi', 0),
  ('44444444-4444-4444-4444-444444444443', 'Балкон', 1),
  ('44444444-4444-4444-4444-444444444443', 'ТВ', 2)
on conflict do nothing;

insert into public.subscriptions (profile_id, role_context, status, plan_name, active_room_limit, trial_ends_at, grace_ends_at, paid_until)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'owner',
    'active',
    'Премиум',
    20,
    timezone('utc', now()) + interval '14 day',
    timezone('utc', now()) + interval '17 day',
    timezone('utc', now()) + interval '30 day'
  )
on conflict (profile_id, role_context) do nothing;

insert into public.guest_requests (
  id,
  source,
  property_id,
  room_id,
  owner_id,
  guest_name,
  guest_phone,
  guest_comment,
  adults_count,
  children_count,
  check_in,
  check_out,
  status,
  base_price_per_night,
  total_price,
  pricing_snapshot
)
values
  (
    '55555555-5555-5555-5555-555555555551',
    'owner',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    'Екатерина Смирнова',
    '+7 900 123-45-67',
    'Хотим ранний заезд, если возможно.',
    2,
    1,
    date '2026-06-15',
    date '2026-06-20',
    'new',
    8900,
    44500,
    '{"nights": 5, "room_title": "Люкс с видом на море"}'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'owner',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    'Анна Петрова',
    '+7 999 456-78-90',
    'Будем на машине.',
    2,
    2,
    date '2026-06-02',
    date '2026-06-07',
    'accepted_by_owner',
    6200,
    31000,
    '{"nights": 5, "room_title": "Семейный номер"}'::jsonb
  )
on conflict (id) do nothing;

insert into public.room_busy_ranges (room_id, starts_on, ends_on, source, label)
values
  ('44444444-4444-4444-4444-444444444441', date '2026-06-10', date '2026-06-12', 'manual', 'Занято'),
  ('44444444-4444-4444-4444-444444444441', date '2026-06-18', date '2026-06-20', 'request', 'Заявка'),
  ('44444444-4444-4444-4444-444444444441', date '2026-06-24', date '2026-06-25', 'blocked', 'Недоступно')
on conflict do nothing;

insert into public.agent_property_links (
  property_id,
  owner_id,
  agent_id,
  status,
  proposal_message,
  collaboration_terms,
  owner_contact_visible
)
values
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'active',
    'Готова приводить гостей по своей витрине.',
    '10% агентская наценка на номер',
    true
  )
on conflict (property_id, agent_id) do nothing;

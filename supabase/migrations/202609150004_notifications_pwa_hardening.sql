alter table public.notifications
  add column if not exists idempotency_key text;

update public.notifications
set idempotency_key = 'legacy:' || id::text
where idempotency_key is null or btrim(idempotency_key) = '';

alter table public.notifications
  alter column idempotency_key set not null;

alter table public.notifications
  drop constraint if exists notifications_channel_check;

alter table public.notifications
  add constraint notifications_channel_check
  check (channel = 'in_app');

create unique index if not exists notifications_recipient_event_idempotency_idx
  on public.notifications(recipient_id, event_type, idempotency_key);

alter table public.notification_deliveries
  add column if not exists delivery_target_key text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.notification_deliveries
set delivery_target_key = coalesce(
  push_subscription_id::text,
  telegram_chat_id,
  'legacy:' || id::text
)
where delivery_target_key is null or btrim(delivery_target_key) = '';

alter table public.notification_deliveries
  alter column delivery_target_key set not null;

alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_channel_check;

alter table public.notification_deliveries
  add constraint notification_deliveries_channel_check
  check (channel in ('push', 'telegram'));

alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_status_check;

alter table public.notification_deliveries
  add constraint notification_deliveries_status_check
  check (
    status in (
      'sent',
      'pending_configuration',
      'skipped_disabled',
      'skipped_no_subscriptions',
      'skipped_not_linked',
      'failed'
    )
  );

create unique index if not exists notification_deliveries_target_idx
  on public.notification_deliveries(notification_id, channel, delivery_target_key);


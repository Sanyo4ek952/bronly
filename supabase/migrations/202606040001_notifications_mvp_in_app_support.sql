alter table public.notifications
  alter column channel set default 'in_app';

create index if not exists notifications_recipient_read_created_idx
  on public.notifications(recipient_id, read_at, created_at desc);

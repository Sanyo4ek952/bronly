alter table public.guest_requests
  add column if not exists completion_requested_at timestamptz;

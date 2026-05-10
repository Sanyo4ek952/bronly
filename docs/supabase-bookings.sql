create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_name text not null,
  phone text not null,
  check_in date not null,
  check_out date not null,
  amount numeric not null default 0,
  status text not null check (status in ('reserved', 'paid', 'living', 'checked_out')),
  comment text,
  created_at timestamptz not null default now(),
  constraint bookings_dates_check check (check_out > check_in)
);

create index if not exists bookings_user_dates_idx
  on public.bookings (user_id, check_in, check_out);

create index if not exists bookings_property_dates_idx
  on public.bookings (property_id, check_in, check_out);

alter table public.bookings enable row level security;

create policy "Users can read own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.properties
      where properties.id = bookings.property_id
        and properties.user_id = auth.uid()
    )
  );

create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.properties
      where properties.id = bookings.property_id
        and properties.user_id = auth.uid()
    )
  );

create policy "Users can delete own bookings"
  on public.bookings for delete
  using (auth.uid() = user_id);

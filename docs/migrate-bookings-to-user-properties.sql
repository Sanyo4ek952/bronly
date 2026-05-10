alter table public.bookings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.bookings
  add column if not exists property_id uuid references public.properties(id) on delete cascade;

create index if not exists bookings_user_dates_idx
  on public.bookings (user_id, check_in, check_out);

create index if not exists bookings_property_dates_idx
  on public.bookings (property_id, check_in, check_out);

drop policy if exists "Public can read bookings" on public.bookings;
drop policy if exists "Anon can insert bookings" on public.bookings;
drop policy if exists "Anon can update bookings" on public.bookings;
drop policy if exists "Anon can delete bookings" on public.bookings;
drop policy if exists "Users can read own bookings" on public.bookings;
drop policy if exists "Users can insert own bookings" on public.bookings;
drop policy if exists "Users can update own bookings" on public.bookings;
drop policy if exists "Users can delete own bookings" on public.bookings;

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

-- After assigning user_id and property_id for existing rows, optionally enforce:
-- alter table public.bookings alter column user_id set not null;
-- alter table public.bookings alter column property_id set not null;

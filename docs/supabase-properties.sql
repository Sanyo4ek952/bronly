create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  city text not null,
  district text,
  address text not null,
  price_per_day integer not null check (price_per_day > 0),
  max_guests integer not null check (max_guests > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.properties enable row level security;

create policy "Users can read own properties"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on public.properties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = user_id);

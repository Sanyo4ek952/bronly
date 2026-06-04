alter table public.profiles
  add column if not exists is_public_hidden_by_admin boolean not null default false;

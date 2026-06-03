-- Allow current_profile_id() to resolve during RLS checks (avoid chicken-and-egg on profiles SELECT).
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

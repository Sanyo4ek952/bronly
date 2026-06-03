-- Bronly admin access bootstrap for the hidden VDH-admin account.
-- 1. Create the auth user manually in Supabase Auth with your private email/password.
-- 2. Run the block below to grant the application role.

with target_profile as (
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.auth_user_id
  where lower(u.email) = lower('Sanyo4ek62@gmail.com')
)
insert into public.user_roles (profile_id, role)
select id, 'admin'::public.app_role
from target_profile
on conflict (profile_id, role) do nothing;

-- Optional rollback: remove only the admin role from the same account.
delete from public.user_roles ur
using public.profiles p, auth.users u
where ur.profile_id = p.id
  and p.auth_user_id = u.id
  and ur.role = 'admin'
  and lower(u.email) = lower('Sanyo4ek62@gmail.com');

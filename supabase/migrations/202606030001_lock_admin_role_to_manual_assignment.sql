create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
  requested_slug text;
begin
  requested_role := case
    when (new.raw_user_meta_data ->> 'role') in ('owner', 'agent')
      then (new.raw_user_meta_data ->> 'role')::public.app_role
    else 'owner'::public.app_role
  end;
  requested_slug := nullif(new.raw_user_meta_data ->> 'slug', '');

  insert into public.profiles (
    auth_user_id,
    slug,
    display_name,
    phone,
    whatsapp,
    telegram
  )
  values (
    new.id,
    requested_slug,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'telegram', '')
  )
  on conflict (auth_user_id) do update
  set
    slug = excluded.slug,
    display_name = excluded.display_name,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    telegram = excluded.telegram;

  insert into public.user_roles (profile_id, role)
  select p.id, requested_role
  from public.profiles p
  where p.auth_user_id = new.id
  on conflict (profile_id, role) do nothing;

  return new;
end;
$$;

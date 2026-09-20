-- Keep the owner-room archive/restore trigger compatible during the subscription
-- schema rollout. Production may still expose active_room_limit, while a fully
-- migrated database exposes room_limit_override and no role_context column.

create or replace function public.enforce_owner_room_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_room_count integer;
  effective_limit integer := 15;
  has_room_limit_override boolean;
  has_active_room_limit boolean;
  has_role_context boolean;
begin
  if tg_op = 'DELETE' or not new.is_active then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('owner-room-limit:' || new.owner_id::text, 0));

  select count(*)::integer
  into active_room_count
  from public.rooms room_row
  where room_row.owner_id = new.owner_id
    and room_row.is_active;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'room_limit_override'
  )
  into has_room_limit_override;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'active_room_limit'
  )
  into has_active_room_limit;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'role_context'
  )
  into has_role_context;

  if has_room_limit_override then
    if has_role_context then
      execute $query$
        select coalesce(room_limit_override, 15)
        from public.subscriptions
        where profile_id = $1 and role_context = 'owner'
        order by updated_at desc
        limit 1
      $query$
      into effective_limit
      using new.owner_id;
    else
      execute $query$
        select coalesce(room_limit_override, 15)
        from public.subscriptions
        where profile_id = $1
        order by updated_at desc
        limit 1
      $query$
      into effective_limit
      using new.owner_id;
    end if;
  elsif has_active_room_limit then
    if has_role_context then
      execute $query$
        select greatest(coalesce(active_room_limit, 15), 15)
        from public.subscriptions
        where profile_id = $1 and role_context = 'owner'
        order by updated_at desc
        limit 1
      $query$
      into effective_limit
      using new.owner_id;
    else
      execute $query$
        select greatest(coalesce(active_room_limit, 15), 15)
        from public.subscriptions
        where profile_id = $1
        order by updated_at desc
        limit 1
      $query$
      into effective_limit
      using new.owner_id;
    end if;
  end if;

  effective_limit := coalesce(effective_limit, 15);

  if active_room_count > effective_limit then
    raise exception 'room_limit_reached'
      using errcode = 'P0001',
            detail = format(
              'profile %s has %s active owner rooms for limit %s',
              new.owner_id,
              active_room_count,
              effective_limit
            );
  end if;

  return null;
end;
$$;

revoke all on function public.enforce_owner_room_limit() from public, anon, authenticated;

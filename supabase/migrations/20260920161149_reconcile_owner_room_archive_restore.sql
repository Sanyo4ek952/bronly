-- Archiving and restoring an owner's room must stay reversible for the owner.
-- Agent limits continue to be enforced by the existing collaboration and
-- property triggers; this trigger is scoped only to owner room mutations.

create or replace function public.enforce_owner_room_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE' then
    perform public.assert_profile_room_limit(new.owner_id);
  end if;

  return null;
end;
$$;

revoke all on function public.enforce_owner_room_limit() from public, anon, authenticated;

drop trigger if exists rooms_enforce_shared_room_limit on public.rooms;
create trigger rooms_enforce_owner_room_limit
after insert or update of is_active, owner_id, property_id or delete on public.rooms
for each row execute function public.enforce_owner_room_limit();

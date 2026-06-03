drop policy if exists "rooms_agent_read_active_links" on public.rooms;
create policy "rooms_agent_read_active_links"
on public.rooms
for select
to authenticated
using (
  exists (
    select 1
    from public.agent_property_links apl
    where apl.property_id = rooms.property_id
      and apl.agent_id = public.current_profile_id()
      and apl.status = 'active'
  )
);

drop policy if exists "room_agent_markups_insert_agent" on public.room_agent_markups;
create policy "room_agent_markups_insert_agent"
on public.room_agent_markups
for insert
to authenticated
with check (
  agent_id = public.current_profile_id()
  and exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    left join public.agent_property_links apl
      on apl.property_id = p.id
     and apl.agent_id = public.current_profile_id()
     and apl.status = 'active'
    where r.id = room_agent_markups.room_id
      and (
        p.owner_id = public.current_profile_id()
        or apl.id is not null
      )
  )
);

drop policy if exists "room_agent_markups_update_agent" on public.room_agent_markups;
create policy "room_agent_markups_update_agent"
on public.room_agent_markups
for update
to authenticated
using (agent_id = public.current_profile_id())
with check (
  agent_id = public.current_profile_id()
  and exists (
    select 1
    from public.rooms r
    join public.properties p on p.id = r.property_id
    left join public.agent_property_links apl
      on apl.property_id = p.id
     and apl.agent_id = public.current_profile_id()
     and apl.status = 'active'
    where r.id = room_agent_markups.room_id
      and (
        p.owner_id = public.current_profile_id()
        or apl.id is not null
      )
  )
);

drop policy if exists "room_agent_markups_delete_agent" on public.room_agent_markups;
create policy "room_agent_markups_delete_agent"
on public.room_agent_markups
for delete
to authenticated
using (agent_id = public.current_profile_id());

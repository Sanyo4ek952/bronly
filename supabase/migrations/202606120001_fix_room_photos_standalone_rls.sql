drop policy if exists "room_photos_public_read" on public.room_photos;
create policy "room_photos_public_read"
on public.room_photos
for select
to public
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_photos.room_id
      and r.is_active = true
      and (
        (
          r.room_kind = 'property_room'
          and exists (
            select 1
            from public.properties p
            where p.id = r.property_id
              and p.published = true
              and p.is_frozen = false
          )
        )
        or r.room_kind = 'standalone_room'
      )
  )
);

drop policy if exists "room_photos_owner_manage" on public.room_photos;
create policy "room_photos_owner_manage"
on public.room_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_photos.room_id
      and r.owner_id = public.current_profile_id()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    where r.id = room_photos.room_id
      and r.owner_id = public.current_profile_id()
  )
);

drop policy if exists "room_photos_agent_read_active_links" on public.room_photos;
create policy "room_photos_agent_read_active_links"
on public.room_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.agent_property_links apl on apl.property_id = r.property_id
    where r.id = room_photos.room_id
      and apl.agent_id = public.current_profile_id()
      and apl.status = 'active'
  )
  or exists (
    select 1
    from public.agent_room_links arl
    where arl.room_id = room_photos.room_id
      and arl.agent_id = public.current_profile_id()
      and arl.status = 'active'
  )
);

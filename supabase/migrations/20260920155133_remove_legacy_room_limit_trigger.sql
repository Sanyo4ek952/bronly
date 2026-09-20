-- The unified subscription model replaced the legacy 3/10-room guard with
-- public.assert_profile_room_limit(). Remove any stale copy left by migration
-- drift so room restoration is evaluated only by the current 15/override rule.

drop trigger if exists rooms_enforce_active_room_limit on public.rooms;
drop function if exists public.enforce_owner_active_room_limit();

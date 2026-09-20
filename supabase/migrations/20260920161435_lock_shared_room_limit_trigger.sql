-- Internal trigger helper: it must not be exposed as an RPC to browser roles.
revoke all on function public.enforce_shared_room_limit() from public, anon, authenticated;

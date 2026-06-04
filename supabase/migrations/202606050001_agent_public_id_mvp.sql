alter table public.profiles
  add column if not exists agent_public_id text;

create unique index if not exists profiles_agent_public_id_key
  on public.profiles (agent_public_id)
  where agent_public_id is not null;

do $$
declare
  profile_record record;
  candidate text;
begin
  for profile_record in
    select p.id
    from public.profiles p
    join public.user_roles ur on ur.profile_id = p.id
    where ur.role = 'agent'
      and p.agent_public_id is null
  loop
    loop
      candidate := 'ag_' || substring(
        md5(
          profile_record.id::text
          || clock_timestamp()::text
          || random()::text
        )
        from 1 for 6
      );

      exit when not exists (
        select 1
        from public.profiles existing
        where existing.agent_public_id = candidate
      );
    end loop;

    update public.profiles
    set agent_public_id = candidate
    where id = profile_record.id;
  end loop;
end $$;

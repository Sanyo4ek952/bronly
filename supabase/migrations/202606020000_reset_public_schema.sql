drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, service_role;

grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
grant all on routines to postgres, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
grant all on sequences to postgres, anon, authenticated, service_role;

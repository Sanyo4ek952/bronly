alter table public.profiles
  add column max_url text;

comment on column public.profiles.max_url is 'Optional public MAX profile link, explicitly provided by the profile owner.';

-- Run once in Supabase SQL Editor.
-- Creates a profile row for the signed-in user if auth.users exists but public.profiles does not
-- (e.g. trigger missing, or user created before trigger was added).

alter table public.profiles add column if not exists email text;

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u record;
begin
  if auth.uid() is null then
    return;
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    return;
  end if;

  select id, email, raw_user_meta_data into u from auth.users where id = auth.uid();
  if not found then
    return;
  end if;

  insert into public.profiles (id, full_name, flat_number, phone, email, role)
  values (
    u.id,
    coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), 'Member'),
    coalesce(nullif(trim(u.raw_user_meta_data->>'flat_number'), ''), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), ''),
    u.email,
    'pending'
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;

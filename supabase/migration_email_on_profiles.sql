-- Run once in Supabase SQL Editor (adds email on profiles for committee visibility)
-- Safe to re-run: uses IF NOT EXISTS

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, flat_number, phone, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Member'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'flat_number'), ''), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    new.email,
    'pending'
  );
  return new;
end;
$$;

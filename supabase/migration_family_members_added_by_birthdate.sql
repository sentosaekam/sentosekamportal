-- Run once in Supabase SQL Editor for existing projects.
-- Adds who-added tracking and optional birth date for family members.

alter table public.family_members
  add column if not exists added_by uuid references public.profiles(id) on delete set null;

alter table public.family_members
  alter column added_by set default auth.uid();

update public.family_members
set added_by = owner_id
where added_by is null;

alter table public.family_members
  add column if not exists birth_date date;

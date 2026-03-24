-- Run once in Supabase SQL Editor (after schema + RLS exist).
-- Lets a signed-in user INSERT their own row only with role = pending (matches trigger/RPC).
-- Enables the portal’s client fallback when ensure_my_profile is missing or fails.

drop policy if exists "profiles_insert_own_pending" on public.profiles;

create policy "profiles_insert_own_pending"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'pending'
  );

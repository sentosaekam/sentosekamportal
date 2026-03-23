-- Run once in Supabase SQL Editor: members/admins can read each other's profile rows
-- (needed for "Booked by: name · flat" on hall bookings). Pending users still only see own row.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_community"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('member', 'admin')
    )
  );

-- Run once in Supabase SQL Editor.
-- Allows admins to delete profile rows (used for removing pending requests).

drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

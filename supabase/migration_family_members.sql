-- Run once in Supabase SQL Editor.
-- Family-member records under main account (no auth account required).

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null default auth.uid(),
  flat_number text not null default '',
  name text not null,
  relation text,
  phone text,
  birth_date date,
  created_at timestamptz not null default now()
);

create index if not exists family_members_owner_idx on public.family_members(owner_id);
create index if not exists family_members_flat_idx on public.family_members(flat_number);

alter table public.family_members enable row level security;

drop policy if exists "family_members_select_owner_or_admin" on public.family_members;
create policy "family_members_select_owner_or_admin"
  on public.family_members for select
  using (auth.uid() = owner_id or public.is_admin());

drop policy if exists "family_members_insert_owner" on public.family_members;
create policy "family_members_insert_owner"
  on public.family_members for insert
  with check (auth.uid() = owner_id);

drop policy if exists "family_members_update_owner_or_admin" on public.family_members;
create policy "family_members_update_owner_or_admin"
  on public.family_members for update
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

drop policy if exists "family_members_delete_owner_or_admin" on public.family_members;
create policy "family_members_delete_owner_or_admin"
  on public.family_members for delete
  using (auth.uid() = owner_id or public.is_admin());

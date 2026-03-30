-- Sentosa Ekam — run in Supabase SQL Editor (new project)
-- After: Authentication → enable Email provider; set Site URL to your deployed URL

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Member',
  flat_number text not null default '',
  phone text,
  role text not null default 'pending'
    check (role in ('pending', 'member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Hall bookings (single common hall — overlap prevented in app + optional DB)
-- ---------------------------------------------------------------------------
create table public.hall_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index hall_bookings_range_idx on public.hall_bookings using btree (start_at, end_at);

-- ---------------------------------------------------------------------------
-- Vehicles (max 4 per flat — enforced by trigger)
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  flat_number text not null,
  registration_number text not null,
  vehicle_type text,
  parking_location text not null default 'basement' check (parking_location in ('basement', 'ground_floor')),
  created_at timestamptz not null default now(),
  unique (flat_number, registration_number)
);

create index vehicles_flat_idx on public.vehicles (flat_number);

create or replace function public.enforce_vehicle_limit_per_flat()
returns trigger
language plpgsql
as $$
declare
  current_count int;
begin
  select count(*)::int into current_count
  from public.vehicles
  where flat_number = new.flat_number;

  if current_count >= 4 then
    raise exception 'VEHICLE_LIMIT_4';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicles_limit_trg on public.vehicles;
create trigger vehicles_limit_trg
  before insert on public.vehicles
  for each row
  execute function public.enforce_vehicle_limit_per_flat();

-- ---------------------------------------------------------------------------
-- Contacts & landmarks (admin-managed)
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_label text,
  phone text,
  email text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.landmarks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('school', 'hospital', 'other')),
  address text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Marketplace listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  price text,
  category text,
  status text not null default 'active' check (status in ('active', 'sold', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status);

-- ---------------------------------------------------------------------------
-- Auth: new user → profile row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, flat_number, phone, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Member'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'flat_number'), ''), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_member_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('member', 'admin')
  );
$$;

create or replace function public.current_profile_flat()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select flat_number from public.profiles where id = auth.uid();
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

drop trigger if exists listings_touch on public.listings;
create trigger listings_touch
  before update on public.listings
  for each row
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.hall_bookings enable row level security;
alter table public.vehicles enable row level security;
alter table public.contacts enable row level security;
alter table public.landmarks enable row level security;
alter table public.listings enable row level security;

-- Profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

-- Self-heal: if trigger/RPC didn’t create a row, the app may insert one (role pending only).
create policy "profiles_insert_own_pending"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'pending'
  );

-- Hall: members + admins
create policy "hall_select_members"
  on public.hall_bookings for select
  using (public.is_member_or_admin());

create policy "hall_insert_own"
  on public.hall_bookings for insert
  with check (public.is_member_or_admin() and auth.uid() = user_id);

create policy "hall_update_own_or_admin"
  on public.hall_bookings for update
  using (auth.uid() = user_id or public.is_admin());

create policy "hall_delete_own_or_admin"
  on public.hall_bookings for delete
  using (auth.uid() = user_id or public.is_admin());

-- Vehicles: same flat or admin
create policy "vehicles_select_flat_or_admin"
  on public.vehicles for select
  using (
    public.is_admin()
    or (
      public.is_member_or_admin()
      and flat_number = public.current_profile_flat()
    )
  );

create policy "vehicles_insert_own_flat"
  on public.vehicles for insert
  with check (
    public.is_member_or_admin()
    and auth.uid() = user_id
    and flat_number = public.current_profile_flat()
  );

create policy "vehicles_delete_own_or_admin"
  on public.vehicles for delete
  using (auth.uid() = user_id or public.is_admin());

-- Contacts & landmarks: read members; write admin
create policy "contacts_read_members"
  on public.contacts for select
  using (public.is_member_or_admin());

create policy "contacts_write_admin"
  on public.contacts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "landmarks_read_members"
  on public.landmarks for select
  using (public.is_member_or_admin());

create policy "landmarks_write_admin"
  on public.landmarks for all
  using (public.is_admin())
  with check (public.is_admin());

-- Listings
create policy "listings_read_members"
  on public.listings for select
  using (public.is_member_or_admin());

create policy "listings_insert_own"
  on public.listings for insert
  with check (public.is_member_or_admin() and auth.uid() = user_id);

create policy "listings_update_own_or_admin"
  on public.listings for update
  using (auth.uid() = user_id or public.is_admin());

create policy "listings_delete_own_or_admin"
  on public.listings for delete
  using (auth.uid() = user_id or public.is_admin());

-- Note: promote your first admin manually after signup:
-- update public.profiles set role = 'admin' where id = (select id from auth.users limit 1);

-- Run once in Supabase SQL Editor for existing projects.
-- Adds rental agreement details to family members and parking location to vehicles.

alter table public.family_members
  add column if not exists is_rented boolean not null default false;

alter table public.family_members
  add column if not exists rent_agreement_status text;

alter table public.family_members
  add column if not exists rent_agreement_end_date date;

alter table public.vehicles
  add column if not exists parking_location text;

update public.vehicles
set parking_location = 'basement'
where parking_location is null;

alter table public.vehicles
  alter column parking_location set default 'basement';

alter table public.vehicles
  alter column parking_location set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vehicles_parking_location_check'
  ) then
    alter table public.vehicles
      add constraint vehicles_parking_location_check
      check (parking_location in ('basement', 'ground_floor'));
  end if;
end $$;

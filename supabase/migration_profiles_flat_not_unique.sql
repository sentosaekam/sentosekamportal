-- Run once in Supabase SQL Editor.
-- Ensures multiple members can share the same flat number in public.profiles.
-- Safe to re-run.

do $$
declare
  c record;
begin
  -- Drop UNIQUE constraints on public.profiles that include flat_number
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'u'
      and conkey is not null
      and exists (
        select 1
        from unnest(conkey) as k(attnum)
        join pg_attribute a
          on a.attrelid = 'public.profiles'::regclass
         and a.attnum = k.attnum
        where a.attname = 'flat_number'
      )
  loop
    execute format('alter table public.profiles drop constraint if exists %I', c.conname);
  end loop;

  -- Drop UNIQUE indexes on public.profiles over flat_number (if any were created manually)
  for c in
    select i.relname as idxname
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class t on t.oid = x.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'profiles'
      and x.indisunique
      and exists (
        select 1
        from unnest(x.indkey) as k(attnum)
        join pg_attribute a
          on a.attrelid = t.oid
         and a.attnum = k.attnum
        where a.attname = 'flat_number'
      )
  loop
    execute format('drop index if exists public.%I', c.idxname);
  end loop;
end
$$;

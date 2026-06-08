-- Keep existing data/routes intact, but stop old long-tail modules from counting
-- against enabled module limits for existing organizations.
with allowed_modules as (
  select array[
    'members',
    'forms',
    'inventory',
    'loans',
    'qr-checkins',
    'bookings',
    'sponsors'
  ]::text[] as ids
)
update organizations
set
  enabled_modules = coalesce(
    (
      select array_agg(module_id order by ordinality)
      from unnest(organizations.enabled_modules) with ordinality as enabled(module_id, ordinality)
      cross join allowed_modules
      where module_id = any(allowed_modules.ids)
    ),
    '{}'::text[]
  ),
  starter_modules = coalesce(
    (
      select array_agg(module_id order by ordinality)
      from unnest(organizations.starter_modules) with ordinality as starter(module_id, ordinality)
      cross join allowed_modules
      where module_id = any(allowed_modules.ids)
    ),
    '{}'::text[]
  ),
  updated_at = now()
where
  exists (
    select 1
    from unnest(organizations.enabled_modules) as enabled(module_id)
    cross join allowed_modules
    where module_id <> all(allowed_modules.ids)
  )
  or exists (
    select 1
    from unnest(organizations.starter_modules) as starter(module_id)
    cross join allowed_modules
    where module_id <> all(allowed_modules.ids)
  );

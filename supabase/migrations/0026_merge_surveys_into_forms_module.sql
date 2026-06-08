-- Surveys now live inside the Forms module and should not count as a separate module.

update public.organizations
set
  enabled_modules = case
    when coalesce(array_length(enabled_modules, 1), 0) > 0
      then array(select module_id from unnest(enabled_modules) as module_id where module_id <> 'surveys')
    else enabled_modules
  end,
  starter_modules = case
    when coalesce(array_length(starter_modules, 1), 0) > 0
      then array(select module_id from unnest(starter_modules) as module_id where module_id <> 'surveys')
    else starter_modules
  end,
  updated_at = now()
where 'surveys' = any(enabled_modules)
   or 'surveys' = any(starter_modules);

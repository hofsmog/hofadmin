insert into public.organization_module_permissions (organization_id, module_id, role, can_access)
select organizations.id, module_ids.module_id, 'manager'::public.organization_role, true
from public.organizations organizations
cross join (
  values
    ('forms'),
    ('inventory'),
    ('documents'),
    ('bookings'),
    ('tasks'),
    ('news'),
    ('issues'),
    ('members'),
    ('loans'),
    ('qr-checkins'),
    ('sponsors'),
    ('messages')
) as module_ids(module_id)
on conflict (organization_id, module_id, role, group_id) do nothing;

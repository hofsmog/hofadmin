-- Performance indexes for dashboard and module list views.
-- 0008 is already used by form design customization, so this migration uses the next available number.

create index if not exists forms_organization_status_created_at_idx
  on public.forms(organization_id, status, created_at desc);

create index if not exists form_fields_organization_form_sort_order_idx
  on public.form_fields(organization_id, form_id, sort_order);

create index if not exists form_submission_values_organization_submission_idx
  on public.form_submission_values(organization_id, submission_id);

create index if not exists form_submissions_organization_form_created_at_idx
  on public.form_submissions(organization_id, form_id, created_at desc);

create index if not exists form_submissions_organization_read_created_at_idx
  on public.form_submissions(organization_id, read_status, created_at desc);

create index if not exists form_submissions_organization_handling_created_at_idx
  on public.form_submissions(organization_id, handling_status, created_at desc);

create index if not exists inventory_items_organization_condition_idx
  on public.inventory_items(organization_id, condition);

create index if not exists inventory_items_organization_category_idx
  on public.inventory_items(organization_id, category_id);

create index if not exists inventory_items_organization_location_idx
  on public.inventory_items(organization_id, location);

create index if not exists inventory_events_organization_item_created_at_idx
  on public.inventory_events(organization_id, inventory_item_id, created_at desc);

create index if not exists members_organization_status_created_at_idx
  on public.members(organization_id, status, created_at desc);

create index if not exists members_organization_type_created_at_idx
  on public.members(organization_id, type, created_at desc);

create index if not exists organization_invitations_organization_status_idx
  on public.organization_invitations(organization_id, status);

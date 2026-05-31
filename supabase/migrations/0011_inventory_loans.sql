-- Inventory loan metadata.
-- 0009 is already used by form product features in this repo, so this uses the next available migration number.

alter table public.inventory_items
  add column if not exists loan_due_date date,
  add column if not exists loan_note text,
  add column if not exists last_assigned_at timestamptz,
  add column if not exists last_returned_at timestamptz;

alter type public.inventory_event_type add value if not exists 'due_date_changed';

create index if not exists inventory_items_organization_loan_due_idx
  on public.inventory_items(organization_id, status, loan_due_date);

create index if not exists inventory_items_organization_assigned_member_idx
  on public.inventory_items(organization_id, assigned_to_member_id);

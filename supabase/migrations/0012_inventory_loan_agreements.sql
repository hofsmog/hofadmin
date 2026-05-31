-- Signed inventory loan agreements.
-- 0010 is already used by performance indexes in this repo.

create type public.inventory_loan_status as enum ('active', 'returned', 'overdue', 'cancelled');

create table public.inventory_loans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  loaned_by uuid not null references auth.users(id) on delete restrict,
  loaned_at timestamptz not null default now(),
  due_date date,
  returned_at timestamptz,
  status public.inventory_loan_status not null default 'active',
  loan_note text,
  agreement_text text not null,
  borrower_name text not null,
  borrower_email text,
  borrower_phone text,
  signature_data_url text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_loans_organization_status_due_idx
  on public.inventory_loans(organization_id, status, due_date);

create index inventory_loans_organization_item_created_idx
  on public.inventory_loans(organization_id, inventory_item_id, created_at desc);

create index inventory_loans_organization_member_created_idx
  on public.inventory_loans(organization_id, member_id, created_at desc);

alter table public.inventory_loans enable row level security;

create policy "Organization members can read inventory loans"
  on public.inventory_loans for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_loans.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create inventory loans"
  on public.inventory_loans for insert
  with check (
    loaned_by = auth.uid()
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_loans.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can update inventory loans"
  on public.inventory_loans for update
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_loans.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_loans.organization_id
        and members.user_id = auth.uid()
    )
  );

-- Category-level Inventory loan agreements and private agreement documents.

alter table public.inventory_categories
  add column if not exists agreement_enabled boolean not null default false,
  add column if not exists agreement_title text,
  add column if not exists agreement_text text,
  add column if not exists agreement_file_path text,
  add column if not exists agreement_file_name text,
  add column if not exists agreement_file_type text,
  add column if not exists agreement_uploaded_at timestamptz,
  add column if not exists agreement_uploaded_by uuid references auth.users(id) on delete set null,
  add column if not exists require_acceptance_before_signature boolean not null default true;

alter table public.inventory_loans
  add column if not exists agreement_category_id uuid references public.inventory_categories(id) on delete set null,
  add column if not exists agreement_title_snapshot text,
  add column if not exists agreement_text_snapshot text,
  add column if not exists agreement_file_path_snapshot text,
  add column if not exists agreement_file_name_snapshot text,
  add column if not exists agreement_accepted_at timestamptz,
  add column if not exists agreement_accepted_by uuid references public.members(id) on delete set null;

alter table public.inventory_events
  alter column inventory_item_id drop not null,
  add column if not exists inventory_category_id uuid references public.inventory_categories(id) on delete cascade;

alter type public.inventory_event_type add value if not exists 'agreement_added';
alter type public.inventory_event_type add value if not exists 'agreement_updated';
alter type public.inventory_event_type add value if not exists 'agreement_accepted';

create index if not exists inventory_categories_agreement_enabled_idx
  on public.inventory_categories(organization_id, agreement_enabled);

create index if not exists inventory_events_category_id_idx
  on public.inventory_events(inventory_category_id);

insert into storage.buckets (id, name, public)
values ('inventory-agreements', 'inventory-agreements', false)
on conflict (id) do nothing;

create policy "Organization members can read inventory agreement files"
  on storage.objects for select
  using (
    bucket_id = 'inventory-agreements'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can upload inventory agreement files"
  on storage.objects for insert
  with check (
    bucket_id = 'inventory-agreements'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can update inventory agreement files"
  on storage.objects for update
  using (
    bucket_id = 'inventory-agreements'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'inventory-agreements'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

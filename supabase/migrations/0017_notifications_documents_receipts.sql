-- Lightweight operational foundations: notifications, member metadata, receipts, and documents.

alter table public.members
  add column if not exists member_number text,
  add column if not exists tags text[] not null default '{}';

create index if not exists members_organization_member_number_idx
  on public.members(organization_id, member_number);

create table if not exists public.organization_notification_preferences (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  enable_email_notifications boolean not null default true,
  notify_new_form_response boolean not null default true,
  notify_loan_due_tomorrow boolean not null default true,
  notify_loan_overdue boolean not null default true,
  notify_new_member_added boolean not null default true,
  notification_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  folder text not null default 'General',
  file_path text not null,
  file_name text not null,
  file_type text,
  related_member_id uuid references public.members(id) on delete set null,
  related_inventory_item_id uuid references public.inventory_items(id) on delete set null,
  record_scope text not null default 'organization',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor text not null,
  amount numeric(12, 2),
  receipt_date date,
  category text,
  notes text,
  file_path text not null,
  file_name text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_organization_created_idx
  on public.documents(organization_id, created_at desc);
create index if not exists documents_organization_folder_idx
  on public.documents(organization_id, folder);
create index if not exists documents_related_member_idx
  on public.documents(organization_id, related_member_id);
create index if not exists documents_related_inventory_item_idx
  on public.documents(organization_id, related_inventory_item_id);
create index if not exists receipts_organization_date_idx
  on public.receipts(organization_id, receipt_date desc, created_at desc);
create index if not exists receipts_organization_category_idx
  on public.receipts(organization_id, category);

alter table public.organization_notification_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.receipts enable row level security;

drop policy if exists "Organization members can read notification preferences" on public.organization_notification_preferences;
create policy "Organization members can read notification preferences"
  on public.organization_notification_preferences for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_notification_preferences.organization_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Owners and admins can manage notification preferences" on public.organization_notification_preferences;
create policy "Owners and admins can manage notification preferences"
  on public.organization_notification_preferences for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_notification_preferences.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_notification_preferences.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

drop policy if exists "Organization members can read documents" on public.documents;
create policy "Organization members can read documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = documents.organization_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Organization members can manage documents" on public.documents;
create policy "Organization members can manage documents"
  on public.documents for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = documents.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = documents.organization_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Organization members can read receipts" on public.receipts;
create policy "Organization members can read receipts"
  on public.receipts for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = receipts.organization_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Organization members can manage receipts" on public.receipts;
create policy "Organization members can manage receipts"
  on public.receipts for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = receipts.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = receipts.organization_id
        and members.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('organization-files', 'organization-files', false)
on conflict (id) do nothing;

drop policy if exists "Organization members can read organization files" on storage.objects;
create policy "Organization members can read organization files"
  on storage.objects for select
  using (
    bucket_id = 'organization-files'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Organization members can upload organization files" on storage.objects;
create policy "Organization members can upload organization files"
  on storage.objects for insert
  with check (
    bucket_id = 'organization-files'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );


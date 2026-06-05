-- Phase 2 operational modules: issues, fault reports, bookings, keys, checklists, visitors, and annual planner.

alter type public.activity_event_type add value if not exists 'issue_created';
alter type public.activity_event_type add value if not exists 'issue_updated';
alter type public.activity_event_type add value if not exists 'fault_report_submitted';
alter type public.activity_event_type add value if not exists 'booking_created';
alter type public.activity_event_type add value if not exists 'key_issued';
alter type public.activity_event_type add value if not exists 'key_returned';
alter type public.activity_event_type add value if not exists 'checklist_completed';
alter type public.activity_event_type add value if not exists 'visitor_checked_in';
alter type public.activity_event_type add value if not exists 'visitor_checked_out';
alter type public.activity_event_type add value if not exists 'annual_planner_task_completed';

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'waiting', 'done', 'closed')),
  assignee_member_id uuid references public.members(id) on delete set null,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issue_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  comment text not null,
  is_internal boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.issue_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.fault_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete set null,
  title text not null,
  description text,
  location text,
  category text,
  contact_person text,
  contact_email text,
  photo_path text,
  status text not null default 'new' check (status in ('new', 'assigned', 'in_progress', 'fixed', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_name text not null,
  resource_type text not null default 'Other',
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'cancelled')),
  responsible_member_id uuid references public.members(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.key_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key_number text not null,
  name text not null,
  category text,
  location text,
  status text not null default 'available' check (status in ('available', 'on_loan', 'lost', 'retired')),
  current_holder_member_id uuid references public.members(id) on delete set null,
  loan_date date,
  return_date date,
  signature_data_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.key_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key_item_id uuid not null references public.key_items(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'issued', 'returned', 'lost', 'updated')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  template_name text,
  assigned_member_id uuid references public.members(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'completed', 'overdue')),
  items jsonb not null default '[]',
  completed_at timestamptz,
  signed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  visitor_name text not null,
  company text,
  email text,
  phone text,
  host_member_id uuid references public.members(id) on delete set null,
  status text not null default 'checked_in' check (status in ('checked_in', 'checked_out')),
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.annual_planner_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text,
  responsible_member_id uuid references public.members(id) on delete set null,
  due_date date not null,
  recurrence text not null default 'none' check (recurrence in ('none', 'monthly', 'quarterly', 'yearly')),
  status text not null default 'upcoming' check (status in ('upcoming', 'due_soon', 'overdue', 'completed')),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_organization_status_idx on public.issues(organization_id, status, created_at desc);
create index if not exists fault_reports_organization_status_idx on public.fault_reports(organization_id, status, created_at desc);
create index if not exists bookings_organization_start_idx on public.bookings(organization_id, start_at);
create index if not exists key_items_organization_status_idx on public.key_items(organization_id, status);
create index if not exists checklists_organization_status_due_idx on public.checklists(organization_id, status, due_date);
create index if not exists visitors_organization_status_idx on public.visitors(organization_id, status, checked_in_at desc);
create index if not exists annual_planner_organization_status_due_idx on public.annual_planner_tasks(organization_id, status, due_date);

alter table public.issues enable row level security;
alter table public.issue_comments enable row level security;
alter table public.issue_attachments enable row level security;
alter table public.fault_reports enable row level security;
alter table public.bookings enable row level security;
alter table public.key_items enable row level security;
alter table public.key_events enable row level security;
alter table public.checklists enable row level security;
alter table public.visitors enable row level security;
alter table public.annual_planner_tasks enable row level security;

create policy "Organization members can manage issues" on public.issues for all using (exists (select 1 from public.organization_members m where m.organization_id = issues.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = issues.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage issue comments" on public.issue_comments for all using (exists (select 1 from public.organization_members m where m.organization_id = issue_comments.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = issue_comments.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage issue attachments" on public.issue_attachments for all using (exists (select 1 from public.organization_members m where m.organization_id = issue_attachments.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = issue_attachments.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage fault reports" on public.fault_reports for all using (exists (select 1 from public.organization_members m where m.organization_id = fault_reports.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = fault_reports.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage bookings" on public.bookings for all using (exists (select 1 from public.organization_members m where m.organization_id = bookings.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = bookings.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage keys" on public.key_items for all using (exists (select 1 from public.organization_members m where m.organization_id = key_items.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = key_items.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage key events" on public.key_events for all using (exists (select 1 from public.organization_members m where m.organization_id = key_events.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = key_events.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage checklists" on public.checklists for all using (exists (select 1 from public.organization_members m where m.organization_id = checklists.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = checklists.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage visitors" on public.visitors for all using (exists (select 1 from public.organization_members m where m.organization_id = visitors.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = visitors.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage annual planner tasks" on public.annual_planner_tasks for all using (exists (select 1 from public.organization_members m where m.organization_id = annual_planner_tasks.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = annual_planner_tasks.organization_id and m.user_id = auth.uid()));


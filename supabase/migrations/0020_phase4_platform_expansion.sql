-- Phase 4 organization platform expansion.

alter type public.activity_event_type add value if not exists 'event_created';
alter type public.activity_event_type add value if not exists 'event_registration_completed';
alter type public.activity_event_type add value if not exists 'announcement_published';
alter type public.activity_event_type add value if not exists 'project_completed';
alter type public.activity_event_type add value if not exists 'contract_renewed';
alter type public.activity_event_type add value if not exists 'article_published';
alter type public.activity_event_type add value if not exists 'purchase_approved';
alter type public.activity_event_type add value if not exists 'department_created';
alter type public.activity_event_type add value if not exists 'timesheet_approved';
alter type public.activity_event_type add value if not exists 'sponsor_added';
alter type public.activity_event_type add value if not exists 'idea_submitted';
alter type public.activity_event_type add value if not exists 'risk_created';
alter type public.activity_event_type add value if not exists 'report_generated';

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.event_categories(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  organizer_member_id uuid references public.members(id) on delete set null,
  capacity integer,
  registration_deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  qr_value text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  attendee_name text not null,
  attendee_email text,
  status text not null default 'registered' check (status in ('registered', 'waiting_list', 'cancelled')),
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  qr_value text
);

create table if not exists public.event_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  content text,
  target_audience text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  pinned boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  read_at timestamptz not null default now(),
  unique (announcement_id, member_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  owner_member_id uuid references public.members(id) on delete set null,
  due_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  attachment_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  assigned_member_id uuid references public.members(id) on delete set null,
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text,
  owner_member_id uuid references public.members(id) on delete set null,
  supplier text,
  start_date date,
  expiration_date date,
  renewal_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'archived')),
  file_path text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version text not null,
  file_path text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.knowledge_categories(id) on delete set null,
  title text not null,
  content text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  view_count integer not null default 0,
  version text not null default '1.0',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procurement_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  supplier text,
  cost_estimate numeric(12,2),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'ordered', 'received', 'rejected')),
  linked_inventory_item_id uuid references public.inventory_items(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  parent_department_id uuid references public.departments(id) on delete set null,
  leader_member_id uuid references public.members(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  unique (department_id, member_id)
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  entry_type text not null default 'work' check (entry_type in ('work', 'volunteer')),
  started_at timestamptz not null,
  ended_at timestamptz,
  hours numeric(8,2),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  notes text,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  sponsor_type text not null default 'sponsor' check (sponsor_type in ('sponsor', 'partner')),
  contact_person text,
  email text,
  phone text,
  sponsorship_value numeric(12,2),
  renewal_date date,
  agreement_path text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'ended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null default 'new' check (status in ('new', 'under_review', 'approved', 'rejected', 'implemented')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  comment text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text,
  impact_level text not null default 'medium' check (impact_level in ('low', 'medium', 'high')),
  probability_level text not null default 'medium' check (probability_level in ('low', 'medium', 'high')),
  mitigation_plan text,
  responsible_member_id uuid references public.members(id) on delete set null,
  review_date date,
  status text not null default 'open' check (status in ('open', 'mitigated', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  filters jsonb not null default '{}',
  export_format text not null default 'csv' check (export_format in ('csv', 'excel', 'pdf')),
  view_count integer not null default 0,
  last_generated_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_org_status_start_idx on public.events(organization_id, status, start_at);
create index if not exists event_registrations_org_event_idx on public.event_registrations(organization_id, event_id, registered_at desc);
create index if not exists announcements_org_status_publish_idx on public.announcements(organization_id, status, publish_at);
create index if not exists projects_org_status_due_idx on public.projects(organization_id, status, due_date);
create index if not exists project_tasks_org_status_due_idx on public.project_tasks(organization_id, status, due_date);
create index if not exists contracts_org_status_dates_idx on public.contracts(organization_id, status, expiration_date, renewal_date);
create index if not exists knowledge_articles_org_status_idx on public.knowledge_articles(organization_id, status, updated_at desc);
create index if not exists procurement_org_status_idx on public.procurement_requests(organization_id, status, created_at desc);
create index if not exists departments_org_parent_idx on public.departments(organization_id, parent_department_id);
create index if not exists time_entries_org_status_idx on public.time_entries(organization_id, status, started_at desc);
create index if not exists sponsors_org_status_renewal_idx on public.sponsors(organization_id, status, renewal_date);
create index if not exists ideas_org_status_idx on public.ideas(organization_id, status, created_at desc);
create index if not exists risks_org_status_review_idx on public.risks(organization_id, status, review_date);
create index if not exists reports_org_generated_idx on public.reports(organization_id, last_generated_at desc);

alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_documents enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_milestones enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.knowledge_categories enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.procurement_requests enable row level security;
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
alter table public.time_entries enable row level security;
alter table public.sponsors enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.idea_comments enable row level security;
alter table public.risks enable row level security;
alter table public.reports enable row level security;

create policy "Organization members can manage event categories" on public.event_categories for all using (exists (select 1 from public.organization_members m where m.organization_id = event_categories.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = event_categories.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage events" on public.events for all using (exists (select 1 from public.organization_members m where m.organization_id = events.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = events.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage event registrations" on public.event_registrations for all using (exists (select 1 from public.organization_members m where m.organization_id = event_registrations.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = event_registrations.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage event documents" on public.event_documents for all using (exists (select 1 from public.organization_members m where m.organization_id = event_documents.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = event_documents.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage announcements" on public.announcements for all using (exists (select 1 from public.organization_members m where m.organization_id = announcements.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = announcements.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage announcement reads" on public.announcement_reads for all using (exists (select 1 from public.organization_members m where m.organization_id = announcement_reads.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = announcement_reads.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage projects" on public.projects for all using (exists (select 1 from public.organization_members m where m.organization_id = projects.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = projects.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage project tasks" on public.project_tasks for all using (exists (select 1 from public.organization_members m where m.organization_id = project_tasks.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = project_tasks.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage project milestones" on public.project_milestones for all using (exists (select 1 from public.organization_members m where m.organization_id = project_milestones.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = project_milestones.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage contracts" on public.contracts for all using (exists (select 1 from public.organization_members m where m.organization_id = contracts.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = contracts.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage contract versions" on public.contract_versions for all using (exists (select 1 from public.organization_members m where m.organization_id = contract_versions.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = contract_versions.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage knowledge categories" on public.knowledge_categories for all using (exists (select 1 from public.organization_members m where m.organization_id = knowledge_categories.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = knowledge_categories.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage knowledge articles" on public.knowledge_articles for all using (exists (select 1 from public.organization_members m where m.organization_id = knowledge_articles.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = knowledge_articles.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage procurement requests" on public.procurement_requests for all using (exists (select 1 from public.organization_members m where m.organization_id = procurement_requests.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = procurement_requests.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage departments" on public.departments for all using (exists (select 1 from public.organization_members m where m.organization_id = departments.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = departments.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage department members" on public.department_members for all using (exists (select 1 from public.organization_members m where m.organization_id = department_members.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = department_members.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage time entries" on public.time_entries for all using (exists (select 1 from public.organization_members m where m.organization_id = time_entries.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = time_entries.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage sponsors" on public.sponsors for all using (exists (select 1 from public.organization_members m where m.organization_id = sponsors.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = sponsors.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage ideas" on public.ideas for all using (exists (select 1 from public.organization_members m where m.organization_id = ideas.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = ideas.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage idea votes" on public.idea_votes for all using (exists (select 1 from public.organization_members m where m.organization_id = idea_votes.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = idea_votes.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage idea comments" on public.idea_comments for all using (exists (select 1 from public.organization_members m where m.organization_id = idea_comments.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = idea_comments.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage risks" on public.risks for all using (exists (select 1 from public.organization_members m where m.organization_id = risks.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = risks.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage reports" on public.reports for all using (exists (select 1 from public.organization_members m where m.organization_id = reports.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = reports.organization_id and m.user_id = auth.uid()));

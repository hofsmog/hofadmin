-- Phase 3 advanced organization management modules.

alter type public.activity_event_type add value if not exists 'asset_lifecycle_updated';
alter type public.activity_event_type add value if not exists 'asset_repair_recorded';
alter type public.activity_event_type add value if not exists 'asset_retired';
alter type public.activity_event_type add value if not exists 'onboarding_started';
alter type public.activity_event_type add value if not exists 'onboarding_completed';
alter type public.activity_event_type add value if not exists 'offboarding_started';
alter type public.activity_event_type add value if not exists 'offboarding_completed';
alter type public.activity_event_type add value if not exists 'policy_published';
alter type public.activity_event_type add value if not exists 'policy_accepted';
alter type public.activity_event_type add value if not exists 'training_completed';
alter type public.activity_event_type add value if not exists 'certification_expired';
alter type public.activity_event_type add value if not exists 'vote_created';
alter type public.activity_event_type add value if not exists 'vote_closed';
alter type public.activity_event_type add value if not exists 'budget_updated';
alter type public.activity_event_type add value if not exists 'vehicle_service_recorded';
alter type public.activity_event_type add value if not exists 'location_created';

alter table public.inventory_items
  add column if not exists supplier text,
  add column if not exists warranty_expiration date,
  add column if not exists model text,
  add column if not exists manufacturer text,
  add column if not exists expected_replacement_date date,
  add column if not exists end_of_life_date date,
  add column if not exists lifecycle_status text not null default 'active' check (lifecycle_status in ('in_stock', 'active', 'loaned', 'in_repair', 'retired', 'lost', 'disposed'));

create table if not exists public.asset_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'updated', 'service', 'repair', 'warranty', 'replacement', 'retired', 'disposed')),
  title text not null,
  event_date date not null default current_date,
  cost numeric(12,2),
  supplier text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  role_title text,
  department text,
  start_date date,
  manager_member_id uuid references public.members(id) on delete set null,
  location text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'in_progress', 'completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  checklist jsonb not null default '[]',
  assigned_assets jsonb not null default '[]',
  assigned_keys jsonb not null default '[]',
  assigned_documents jsonb not null default '[]',
  assigned_policies jsonb not null default '[]',
  assigned_training jsonb not null default '[]',
  signature_data_url text,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offboarding_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  name text not null,
  role_title text,
  department text,
  departure_date date,
  manager_member_id uuid references public.members(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  checklist jsonb not null default '[]',
  missing_assets_count integer not null default 0,
  outstanding_keys_count integer not null default 0,
  signature_data_url text,
  completed_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  version text not null default '1.0',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  document_record_id uuid references public.documents(id) on delete set null,
  file_path text,
  require_acknowledgement boolean not null default true,
  require_signature boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  policy_version text not null,
  signed_at timestamptz,
  signature_data_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  member_id uuid references public.members(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'expired')),
  due_date date,
  completed_at timestamptz,
  expires_at date,
  certification_file_path text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  vote_type text not null default 'vote' check (vote_type in ('vote', 'election')),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  anonymous boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vote_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vote_id uuid not null references public.votes(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vote_ballots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vote_id uuid not null references public.votes(id) on delete cascade,
  option_id uuid references public.vote_options(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (vote_id, member_id)
);

create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  category text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  registration_number text,
  vin text,
  status text not null default 'active' check (status in ('active', 'in_service', 'out_of_service')),
  assigned_member_id uuid references public.members(id) on delete set null,
  next_service_date date,
  inspection_date date,
  insurance_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  event_type text not null check (event_type in ('service', 'inspection', 'insurance', 'booking', 'updated')),
  event_date date not null default current_date,
  notes text,
  cost numeric(12,2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  location_type text not null default 'location' check (location_type in ('location', 'building', 'floor', 'room')),
  parent_location_id uuid references public.locations(id) on delete set null,
  building text,
  floor text,
  room text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_lifecycle_alerts_idx on public.inventory_items(organization_id, lifecycle_status, warranty_expiration, expected_replacement_date);
create index if not exists asset_lifecycle_events_org_item_idx on public.asset_lifecycle_events(organization_id, inventory_item_id, created_at desc);
create index if not exists onboarding_processes_org_status_idx on public.onboarding_processes(organization_id, status, start_date);
create index if not exists offboarding_processes_org_status_idx on public.offboarding_processes(organization_id, status, departure_date);
create index if not exists policies_org_status_idx on public.policies(organization_id, status, created_at desc);
create index if not exists policy_acknowledgements_org_status_idx on public.policy_acknowledgements(organization_id, status, created_at desc);
create index if not exists training_records_org_status_idx on public.training_records(organization_id, status, due_date, expires_at);
create index if not exists votes_org_status_idx on public.votes(organization_id, status, starts_at, ends_at);
create index if not exists budget_categories_org_idx on public.budget_categories(organization_id, created_at desc);
create index if not exists vehicles_org_status_idx on public.vehicles(organization_id, status, next_service_date, inspection_date);
create index if not exists locations_org_parent_idx on public.locations(organization_id, parent_location_id);

alter table public.asset_lifecycle_events enable row level security;
alter table public.onboarding_processes enable row level security;
alter table public.offboarding_processes enable row level security;
alter table public.policies enable row level security;
alter table public.policy_acknowledgements enable row level security;
alter table public.training_records enable row level security;
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.vote_ballots enable row level security;
alter table public.budget_categories enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_events enable row level security;
alter table public.locations enable row level security;

create policy "Organization members can manage asset lifecycle events" on public.asset_lifecycle_events for all using (exists (select 1 from public.organization_members m where m.organization_id = asset_lifecycle_events.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = asset_lifecycle_events.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage onboarding processes" on public.onboarding_processes for all using (exists (select 1 from public.organization_members m where m.organization_id = onboarding_processes.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = onboarding_processes.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage offboarding processes" on public.offboarding_processes for all using (exists (select 1 from public.organization_members m where m.organization_id = offboarding_processes.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = offboarding_processes.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage policies" on public.policies for all using (exists (select 1 from public.organization_members m where m.organization_id = policies.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = policies.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage policy acknowledgements" on public.policy_acknowledgements for all using (exists (select 1 from public.organization_members m where m.organization_id = policy_acknowledgements.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = policy_acknowledgements.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage training records" on public.training_records for all using (exists (select 1 from public.organization_members m where m.organization_id = training_records.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = training_records.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage votes" on public.votes for all using (exists (select 1 from public.organization_members m where m.organization_id = votes.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = votes.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage vote options" on public.vote_options for all using (exists (select 1 from public.organization_members m where m.organization_id = vote_options.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = vote_options.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage vote ballots" on public.vote_ballots for all using (exists (select 1 from public.organization_members m where m.organization_id = vote_ballots.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = vote_ballots.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage budget categories" on public.budget_categories for all using (exists (select 1 from public.organization_members m where m.organization_id = budget_categories.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = budget_categories.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage vehicles" on public.vehicles for all using (exists (select 1 from public.organization_members m where m.organization_id = vehicles.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = vehicles.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage vehicle events" on public.vehicle_events for all using (exists (select 1 from public.organization_members m where m.organization_id = vehicle_events.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = vehicle_events.organization_id and m.user_id = auth.uid()));
create policy "Organization members can manage locations" on public.locations for all using (exists (select 1 from public.organization_members m where m.organization_id = locations.organization_id and m.user_id = auth.uid())) with check (exists (select 1 from public.organization_members m where m.organization_id = locations.organization_id and m.user_id = auth.uid()));

create type public.inventory_item_status as enum ('available', 'in_use', 'maintenance', 'lost', 'retired');
create type public.inventory_item_condition as enum ('new', 'good', 'fair', 'poor', 'broken');
create type public.inventory_event_type as enum (
  'created',
  'updated',
  'assigned',
  'returned',
  'status_changed',
  'location_changed',
  'maintenance',
  'retired'
);

alter table public.forms
  add column if not exists submit_button_text text not null default 'Submit'
    check (char_length(submit_button_text) between 1 and 40);

create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  color text not null default '#2563eb' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 140),
  description text,
  category_id uuid references public.inventory_categories(id) on delete set null,
  asset_tag text,
  serial_number text,
  status public.inventory_item_status not null default 'available',
  condition public.inventory_item_condition not null default 'good',
  location text,
  assigned_to_member_id uuid,
  qr_value text,
  purchase_date date,
  purchase_price numeric(12, 2),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_tag)
);

create table public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  event_type public.inventory_event_type not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_categories_organization_id_idx on public.inventory_categories(organization_id);
create index inventory_items_organization_id_created_at_idx on public.inventory_items(organization_id, created_at desc);
create index inventory_items_status_idx on public.inventory_items(organization_id, status);
create index inventory_items_category_id_idx on public.inventory_items(category_id);
create index inventory_events_organization_id_created_at_idx on public.inventory_events(organization_id, created_at desc);
create index inventory_events_item_id_idx on public.inventory_events(inventory_item_id);

alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_events enable row level security;

create policy "Organization members can read inventory categories"
  on public.inventory_categories for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_categories.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can manage inventory categories"
  on public.inventory_categories for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_categories.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_categories.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can read inventory items"
  on public.inventory_items for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_items.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can manage inventory items"
  on public.inventory_items for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_items.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_items.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can read inventory events"
  on public.inventory_events for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_events.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create inventory events"
  on public.inventory_events for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = inventory_events.organization_id
        and members.user_id = auth.uid()
    )
  );

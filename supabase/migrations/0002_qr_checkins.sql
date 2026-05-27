create type public.qr_item_type as enum ('general', 'event', 'member', 'asset', 'location');

create table public.qr_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  type public.qr_item_type not null default 'general',
  description text,
  qr_value text not null unique,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  qr_item_id uuid references public.qr_items(id) on delete set null,
  checkin_value text not null,
  attendee_name text,
  notes text,
  checked_in_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index qr_items_organization_id_idx on public.qr_items(organization_id);
create index checkins_organization_id_created_at_idx on public.checkins(organization_id, created_at desc);
create index checkins_qr_item_id_idx on public.checkins(qr_item_id);

alter table public.qr_items enable row level security;
alter table public.checkins enable row level security;

create policy "Organization members can read QR items"
  on public.qr_items for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = qr_items.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage QR items"
  on public.qr_items for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = qr_items.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can update QR items"
  on public.qr_items for update
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = qr_items.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = qr_items.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "Organization members can read check-ins"
  on public.checkins for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = checkins.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create check-ins"
  on public.checkins for insert
  with check (
    checked_in_by = auth.uid()
    and (
      qr_item_id is null
      or exists (
        select 1
        from public.qr_items items
        where items.id = checkins.qr_item_id
          and items.organization_id = checkins.organization_id
      )
    )
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = checkins.organization_id
        and members.user_id = auth.uid()
    )
  );

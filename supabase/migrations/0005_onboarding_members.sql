create type public.organization_type as enum (
  'school',
  'club',
  'business',
  'restaurant',
  'cafe',
  'event',
  'other'
);

create type public.member_status as enum ('active', 'inactive');

create type public.member_type as enum (
  'student',
  'staff',
  'player',
  'volunteer',
  'employee',
  'customer',
  'guest',
  'other'
);

alter type public.activity_event_type add value if not exists 'member_created';

alter table public.organizations
  add column if not exists organization_type public.organization_type,
  add column if not exists starter_modules text[] not null default '{}'::text[],
  add column if not exists onboarding_checklist jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  status public.member_status not null default 'active',
  type public.member_type not null default 'other',
  email text,
  phone text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_qr_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  qr_item_id uuid references public.qr_items(id) on delete set null,
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (organization_id, member_id, qr_item_id)
);

create index members_organization_id_created_at_idx on public.members(organization_id, created_at desc);
create index members_organization_id_status_idx on public.members(organization_id, status);
create index member_qr_links_organization_id_idx on public.member_qr_links(organization_id);
create index member_qr_links_member_id_idx on public.member_qr_links(member_id);

alter table public.members enable row level security;
alter table public.member_qr_links enable row level security;

create policy "Organization members can read members"
  on public.members for select
  using (
    exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = members.organization_id
        and org_members.user_id = auth.uid()
    )
  );

create policy "Organization members can create members"
  on public.members for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = members.organization_id
        and org_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can update members"
  on public.members for update
  using (
    exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = members.organization_id
        and org_members.user_id = auth.uid()
        and org_members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = members.organization_id
        and org_members.user_id = auth.uid()
        and org_members.role in ('owner', 'admin')
    )
  );

create policy "Organization members can read member QR links"
  on public.member_qr_links for select
  using (
    exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = member_qr_links.organization_id
        and org_members.user_id = auth.uid()
    )
  );

create policy "Organization members can create member QR links"
  on public.member_qr_links for insert
  with check (
    linked_by = auth.uid()
    and exists (
      select 1
      from public.members linked_member
      where linked_member.id = member_qr_links.member_id
        and linked_member.organization_id = member_qr_links.organization_id
    )
    and (
      qr_item_id is null
      or exists (
        select 1
        from public.qr_items linked_qr
        where linked_qr.id = member_qr_links.qr_item_id
          and linked_qr.organization_id = member_qr_links.organization_id
      )
    )
    and exists (
      select 1
      from public.organization_members org_members
      where org_members.organization_id = member_qr_links.organization_id
        and org_members.user_id = auth.uid()
    )
  );

create type public.organization_role as enum ('owner', 'admin', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique,
  avatar_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'member',
  invited_by uuid not null references auth.users(id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (organization_id, email, status)
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index organization_invitations_organization_id_idx on public.organization_invitations(organization_id);

create or replace function public.create_organization_with_owner(
  org_name text,
  org_slug text,
  org_avatar_url text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations (name, slug, avatar_url, created_by)
  values (org_name, org_slug, org_avatar_url, auth.uid())
  returning * into new_organization;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization.id, auth.uid(), 'owner');

  return new_organization;
end;
$$;

grant execute on function public.create_organization_with_owner(text, text, text) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

create policy "Members can read their organizations"
  on public.organizations for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organizations.id
        and members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (created_by = auth.uid());

create policy "Owners and admins can update organizations"
  on public.organizations for update
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organizations.id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organizations.id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "Members can read organization memberships"
  on public.organization_members for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_members.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can read invitations"
  on public.organization_invitations for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitations.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can create invitations"
  on public.organization_invitations for insert
  with check (
    invited_by = auth.uid()
    and role in ('admin', 'member')
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitations.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

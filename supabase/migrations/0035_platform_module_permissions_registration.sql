alter table public.organizations
  add column if not exists public_registration_enabled boolean not null default true,
  add column if not exists default_registration_role public.organization_role not null default 'member';

create table if not exists public.organization_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.organization_group_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.organization_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.organization_module_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id text not null,
  role public.organization_role,
  group_id uuid references public.organization_groups(id) on delete cascade,
  can_access boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role is not null or group_id is not null),
  unique nulls not distinct (organization_id, module_id, role, group_id)
);

create index if not exists organization_module_permissions_org_module_idx
  on public.organization_module_permissions(organization_id, module_id);

create index if not exists organization_group_members_user_idx
  on public.organization_group_members(organization_id, user_id);

insert into public.organization_module_permissions (organization_id, module_id, role, can_access)
select organizations.id, module_ids.module_id, roles.role::public.organization_role, true
from public.organizations organizations
cross join (
  values
    ('forms'),
    ('inventory'),
    ('documents'),
    ('bookings'),
    ('tasks'),
    ('news'),
    ('issues'),
    ('members'),
    ('loans'),
    ('qr-checkins'),
    ('sponsors'),
    ('messages')
) as module_ids(module_id)
cross join (
  values ('owner'), ('admin'), ('member')
) as roles(role)
on conflict (organization_id, module_id, role, group_id) do nothing;

alter table public.organization_groups enable row level security;
alter table public.organization_group_members enable row level security;
alter table public.organization_module_permissions enable row level security;

drop policy if exists "Organization members can read groups" on public.organization_groups;
create policy "Organization members can read groups"
  on public.organization_groups for select
  using (public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "Owners and admins can manage groups" on public.organization_groups;
create policy "Owners and admins can manage groups"
  on public.organization_groups for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_groups.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_groups.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

drop policy if exists "Organization members can read group members" on public.organization_group_members;
create policy "Organization members can read group members"
  on public.organization_group_members for select
  using (public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "Owners and admins can manage group members" on public.organization_group_members;
create policy "Owners and admins can manage group members"
  on public.organization_group_members for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_group_members.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_group_members.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

drop policy if exists "Organization members can read module permissions" on public.organization_module_permissions;
create policy "Organization members can read module permissions"
  on public.organization_module_permissions for select
  using (public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "Owners and admins can manage module permissions" on public.organization_module_permissions;
create policy "Owners and admins can manage module permissions"
  on public.organization_module_permissions for all
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_module_permissions.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = organization_module_permissions.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create or replace function public.can_access_organization_module(
  p_organization_id uuid,
  p_user_id uuid,
  p_module_id text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with membership as (
    select role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id
    limit 1
  )
  select coalesce(
    (
      select true
      from membership
      where role in ('owner', 'admin')
      limit 1
    ),
    (
      select exists (
        select 1
        from public.organization_module_permissions permissions
        where permissions.organization_id = p_organization_id
          and permissions.module_id = p_module_id
          and permissions.can_access
          and (
            permissions.role = membership.role
            or exists (
              select 1
              from public.organization_group_members group_members
              where group_members.organization_id = p_organization_id
                and group_members.user_id = p_user_id
                and group_members.group_id = permissions.group_id
            )
          )
      )
      from membership
    ),
    false
  );
$$;

grant execute on function public.can_access_organization_module(uuid, uuid, text) to authenticated;

create or replace function public.join_public_organization_by_slug(p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_organization
  from public.organizations
  where slug = p_slug
    and public_registration_enabled = true
  limit 1;

  if target_organization.id is null then
    raise exception 'Organization registration is not available';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (target_organization.id, auth.uid(), target_organization.default_registration_role)
  on conflict (organization_id, user_id) do update
    set role = public.organization_members.role
  returning organization_id into target_organization.id;

  return target_organization.id;
end;
$$;

grant execute on function public.join_public_organization_by_slug(text) to authenticated;

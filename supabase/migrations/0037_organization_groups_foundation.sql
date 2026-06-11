alter table public.organization_groups
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.organization_group_members
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists added_by uuid references auth.users(id) on delete set null;

update public.organization_group_members
set id = gen_random_uuid()
where id is null;

alter table public.organization_group_members
  alter column id set not null;

alter table public.organization_group_members
  drop constraint if exists organization_group_members_pkey;

alter table public.organization_group_members
  add constraint organization_group_members_pkey primary key (id);

alter table public.organization_group_members
  add constraint organization_group_members_group_user_unique unique (group_id, user_id);

create index if not exists organization_groups_org_name_idx
  on public.organization_groups(organization_id, name);

create index if not exists organization_group_members_group_idx
  on public.organization_group_members(organization_id, group_id);

create or replace function public.is_organization_admin(
  p_organization_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members members
    where members.organization_id = p_organization_id
      and members.user_id = p_user_id
      and members.role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_organization_admin(uuid, uuid) to authenticated;

create or replace function public.is_organization_group_member(
  p_organization_id uuid,
  p_group_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_group_members members
    where members.organization_id = p_organization_id
      and members.group_id = p_group_id
      and members.user_id = p_user_id
  );
$$;

grant execute on function public.is_organization_group_member(uuid, uuid, uuid) to authenticated;

drop policy if exists "Organization members can read groups" on public.organization_groups;
create policy "Organization members can read groups"
  on public.organization_groups for select
  using (
    auth.uid() is not null
    and (
      public.is_organization_admin(organization_id, auth.uid())
      or public.is_organization_group_member(organization_id, id, auth.uid())
    )
  );

drop policy if exists "Owners and admins can manage groups" on public.organization_groups;
create policy "Owners and admins can manage groups"
  on public.organization_groups for all
  using (
    auth.uid() is not null
    and public.is_organization_admin(organization_id, auth.uid())
  )
  with check (
    auth.uid() is not null
    and public.is_organization_admin(organization_id, auth.uid())
  );

drop policy if exists "Organization members can read group members" on public.organization_group_members;
create policy "Organization members can read group members"
  on public.organization_group_members for select
  using (
    auth.uid() is not null
    and (
      public.is_organization_admin(organization_id, auth.uid())
      or public.is_organization_group_member(organization_id, group_id, auth.uid())
    )
  );

drop policy if exists "Owners and admins can manage group members" on public.organization_group_members;
create policy "Owners and admins can manage group members"
  on public.organization_group_members for all
  using (
    auth.uid() is not null
    and public.is_organization_admin(organization_id, auth.uid())
  )
  with check (
    auth.uid() is not null
    and public.is_organization_admin(organization_id, auth.uid())
    and public.is_organization_member(organization_id, user_id)
  );

create or replace function public.set_organization_group_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organization_group_updated_at on public.organization_groups;
create trigger set_organization_group_updated_at
  before update on public.organization_groups
  for each row
  execute function public.set_organization_group_updated_at();

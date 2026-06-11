do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_groups_organization_id_id_unique'
  ) then
    alter table public.organization_groups
      add constraint organization_groups_organization_id_id_unique unique (organization_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_group_members_group_same_org_fkey'
  ) then
    alter table public.organization_group_members
      add constraint organization_group_members_group_same_org_fkey
      foreign key (organization_id, group_id)
      references public.organization_groups(organization_id, id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_group_members_user_same_org_fkey'
  ) then
    alter table public.organization_group_members
      add constraint organization_group_members_user_same_org_fkey
      foreign key (organization_id, user_id)
      references public.organization_members(organization_id, user_id)
      on delete cascade;
  end if;
end $$;

create or replace function public.can_manage_organization_groups(
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
      and members.role::text in ('owner', 'admin', 'manager')
  );
$$;

grant execute on function public.can_manage_organization_groups(uuid, uuid) to authenticated;

drop policy if exists "Organization members can read groups" on public.organization_groups;
create policy "Organization members can read groups"
  on public.organization_groups for select
  using (
    auth.uid() is not null
    and (
      public.can_manage_organization_groups(organization_id, auth.uid())
      or public.is_organization_group_member(organization_id, id, auth.uid())
    )
  );

drop policy if exists "Owners and admins can manage groups" on public.organization_groups;
drop policy if exists "Owners admins and managers can manage groups" on public.organization_groups;
create policy "Owners admins and managers can manage groups"
  on public.organization_groups for all
  using (
    auth.uid() is not null
    and public.can_manage_organization_groups(organization_id, auth.uid())
  )
  with check (
    auth.uid() is not null
    and public.can_manage_organization_groups(organization_id, auth.uid())
  );

drop policy if exists "Organization members can read group members" on public.organization_group_members;
create policy "Organization members can read group members"
  on public.organization_group_members for select
  using (
    auth.uid() is not null
    and (
      public.can_manage_organization_groups(organization_id, auth.uid())
      or public.is_organization_group_member(organization_id, group_id, auth.uid())
    )
  );

drop policy if exists "Owners and admins can manage group members" on public.organization_group_members;
drop policy if exists "Owners admins and managers can manage group members" on public.organization_group_members;
create policy "Owners admins and managers can manage group members"
  on public.organization_group_members for all
  using (
    auth.uid() is not null
    and public.can_manage_organization_groups(organization_id, auth.uid())
  )
  with check (
    auth.uid() is not null
    and public.can_manage_organization_groups(organization_id, auth.uid())
    and public.is_organization_member(organization_id, user_id)
  );

insert into public.organization_module_permissions (organization_id, module_id, role, can_access)
select organizations.id, module_ids.module_id, 'manager'::public.organization_role, true
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
where exists (
  select 1
  from pg_enum
  join pg_type on pg_type.oid = pg_enum.enumtypid
  join pg_namespace on pg_namespace.oid = pg_type.typnamespace
  where pg_namespace.nspname = 'public'
    and pg_type.typname = 'organization_role'
    and pg_enum.enumlabel = 'manager'
)
on conflict (organization_id, module_id, role, group_id) do nothing;

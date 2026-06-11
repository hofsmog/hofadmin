alter type public.organization_role add value if not exists 'manager' after 'admin';

alter table public.organization_groups
  add constraint organization_groups_organization_id_id_unique unique (organization_id, id);

do $$
begin
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
      and members.role in ('owner', 'admin', 'manager')
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

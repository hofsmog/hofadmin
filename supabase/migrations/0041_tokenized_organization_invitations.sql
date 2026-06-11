alter table public.organization_invitations
  add column if not exists token text,
  add column if not exists invited_name text,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_by uuid references auth.users(id) on delete set null;

update public.organization_invitations
set token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where token is null;

alter table public.organization_invitations
  alter column token set not null;

create unique index if not exists organization_invitations_token_unique
  on public.organization_invitations(token);

create table if not exists public.organization_invitation_groups (
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.organization_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (invitation_id, group_id)
);

alter table public.organization_invitation_groups enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_invitation_groups_group_same_org_fkey'
  ) then
    alter table public.organization_invitation_groups
      add constraint organization_invitation_groups_group_same_org_fkey
      foreign key (organization_id, group_id)
      references public.organization_groups(organization_id, id)
      on delete cascade;
  end if;
end $$;

drop policy if exists "Owners and admins can read invitation groups" on public.organization_invitation_groups;
create policy "Owners and admins can read invitation groups"
  on public.organization_invitation_groups for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitation_groups.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

drop policy if exists "Owners and admins can manage invitation groups" on public.organization_invitation_groups;
create policy "Owners and admins can manage invitation groups"
  on public.organization_invitation_groups for all
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitation_groups.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitation_groups.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create or replace function public.get_organization_invitation_by_token(p_token text)
returns table (
  invitation_id uuid,
  invitation_token text,
  organization_name text,
  invited_email text,
  invited_name text,
  invited_role public.organization_role,
  inviter_name text,
  invitation_status public.invitation_status,
  expires_at timestamptz,
  invitation_expired boolean
)
language sql
security definer
set search_path = public
as $$
  select
    invitations.id,
    invitations.token,
    coalesce(organizations.display_name, organizations.name) as organization_name,
    invitations.email as invited_email,
    invitations.invited_name,
    invitations.role as invited_role,
    coalesce(
      nullif(trim(inviter.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(inviter.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(inviter.raw_user_meta_data ->> 'name'), ''),
      inviter.email
    ) as inviter_name,
    invitations.status as invitation_status,
    invitations.expires_at,
    invitations.expires_at is not null and invitations.expires_at <= now() as invitation_expired
  from public.organization_invitations invitations
  join public.organizations organizations on organizations.id = invitations.organization_id
  left join auth.users inviter on inviter.id = invitations.invited_by
  where invitations.token = p_token
  limit 1;
$$;

grant execute on function public.get_organization_invitation_by_token(text) to anon, authenticated;

create or replace function public.accept_organization_invitation_by_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.organization_invitations;
  current_email text;
  member_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select lower(email) into current_email
  from auth.users
  where id = auth.uid();

  select *
  into invitation
  from public.organization_invitations
  where token = p_token
    and status = 'pending'
    and lower(email) = current_email
    and (expires_at is null or expires_at > now())
  limit 1;

  if invitation.id is null then
    raise exception 'Invitation is not available for this account.';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (invitation.organization_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (organization_id, user_id)
  do update set
    role = excluded.role,
    invited_by = excluded.invited_by;

  select coalesce(
    nullif(trim(invitation.invited_name), ''),
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
    split_part(users.email, '@', 1),
    'New member'
  )
  into member_name
  from auth.users users
  where users.id = auth.uid();

  insert into public.members (organization_id, name, status, type, email, created_by)
  select invitation.organization_id, case when char_length(member_name) >= 2 then left(member_name, 120) else 'New member' end, 'active', 'other', current_email, invitation.invited_by
  where not exists (
    select 1
    from public.members existing_members
    where existing_members.organization_id = invitation.organization_id
      and lower(existing_members.email) = current_email
  );

  insert into public.organization_group_members (organization_id, group_id, user_id, added_by)
  select invitation_groups.organization_id, invitation_groups.group_id, auth.uid(), invitation.invited_by
  from public.organization_invitation_groups invitation_groups
  where invitation_groups.invitation_id = invitation.id
  on conflict (group_id, user_id) do nothing;

  update public.organization_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_by = auth.uid()
  where id = invitation.id;

  return invitation.organization_id;
end;
$$;

grant execute on function public.accept_organization_invitation_by_token(text) to authenticated;

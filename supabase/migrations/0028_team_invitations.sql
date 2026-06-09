-- Team invitations: resend/cancel support and a safe accept flow for invited users.

drop policy if exists "Owners and admins can create invitations" on public.organization_invitations;
create policy "Owners and admins can create invitations"
  on public.organization_invitations for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitations.organization_id
        and members.user_id = auth.uid()
        and (
          members.role = 'owner'
          or (members.role = 'admin' and organization_invitations.role in ('admin', 'member'))
        )
    )
  );

drop policy if exists "Owners and admins can update invitations" on public.organization_invitations;
create policy "Owners and admins can update invitations"
  on public.organization_invitations for update
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitations.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = organization_invitations.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create or replace function public.get_organization_invitation_acceptance_context(p_invitation_id uuid)
returns table (
  invitation_id uuid,
  organization_name text,
  invited_email text,
  invited_role public.organization_role,
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
    coalesce(organizations.display_name, organizations.name) as organization_name,
    invitations.email as invited_email,
    invitations.role as invited_role,
    invitations.status as invitation_status,
    invitations.expires_at,
    invitations.expires_at is not null and invitations.expires_at <= now() as invitation_expired
  from public.organization_invitations invitations
  join public.organizations organizations on organizations.id = invitations.organization_id
  where invitations.id = p_invitation_id
  limit 1;
$$;

grant execute on function public.get_organization_invitation_acceptance_context(uuid) to anon, authenticated;

create or replace function public.accept_organization_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.organization_invitations;
  current_email text;
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
  where id = p_invitation_id
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

  update public.organization_invitations
  set status = 'accepted'
  where id = invitation.id;

  return invitation.organization_id;
end;
$$;

grant execute on function public.accept_organization_invitation(uuid) to authenticated;

-- Keep legacy UUID invitation links behaviorally aligned with token invitation links.
-- This makes acceptance idempotently create organization membership, member profile,
-- group memberships, and acceptance metadata.

create or replace function public.accept_organization_invitation(p_invitation_id uuid)
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
  select
    invitation.organization_id,
    case when char_length(member_name) >= 2 then left(member_name, 120) else 'New member' end,
    'active',
    'other',
    current_email,
    invitation.invited_by
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

grant execute on function public.accept_organization_invitation(uuid) to authenticated;

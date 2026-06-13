-- Keep organization access users and visible member records in sync.
-- Invitation acceptance must create both:
-- 1. organization_members: access to the organization
-- 2. members: visible member/person record shown in Members & Teams

create or replace function public.ensure_organization_member_profile(
  p_organization_id uuid,
  p_user_id uuid,
  p_created_by uuid default null,
  p_member_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  resolved_name text;
  creator_id uuid;
  member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if auth.uid() <> p_user_id and not exists (
    select 1
    from public.organization_members caller
    where caller.organization_id = p_organization_id
      and caller.user_id = auth.uid()
      and caller.role::text in ('owner', 'admin', 'manager')
  ) then
    raise exception 'You do not have permission to sync this member profile.';
  end if;

  if not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = p_user_id
  ) then
    raise exception 'Organization membership must exist before creating a member profile.';
  end if;

  select
    lower(users.email),
    coalesce(
      nullif(trim(p_member_name), ''),
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
      split_part(users.email, '@', 1),
      'New member'
    )
  into user_email, resolved_name
  from auth.users users
  where users.id = p_user_id;

  if user_email is null then
    raise exception 'User email could not be resolved for member profile sync.';
  end if;

  select existing_members.id
  into member_id
  from public.members existing_members
  where existing_members.organization_id = p_organization_id
    and lower(existing_members.email) = user_email
  order by existing_members.created_at asc
  limit 1;

  if member_id is not null then
    raise log '[members-sync] Existing member profile found. organization_id=%, user_id=%, member_id=%',
      p_organization_id, p_user_id, member_id;
    return member_id;
  end if;

  creator_id := coalesce(p_created_by, auth.uid());

  insert into public.members (organization_id, name, status, type, email, created_by)
  values (
    p_organization_id,
    case when char_length(resolved_name) >= 2 then left(resolved_name, 120) else 'New member' end,
    'active',
    'other',
    user_email,
    creator_id
  )
  returning id into member_id;

  raise log '[members-sync] Created member profile. organization_id=%, user_id=%, member_id=%',
    p_organization_id, p_user_id, member_id;

  return member_id;
end;
$$;

grant execute on function public.ensure_organization_member_profile(uuid, uuid, uuid, text) to authenticated;

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

  raise log '[invitations] Accepting UUID invitation. invitation_id=%, organization_id=%, user_id=%',
    invitation.id, invitation.organization_id, auth.uid();

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (invitation.organization_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (organization_id, user_id)
  do update set
    role = excluded.role,
    invited_by = excluded.invited_by;

  perform public.ensure_organization_member_profile(
    invitation.organization_id,
    auth.uid(),
    invitation.invited_by,
    invitation.invited_name
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

  raise log '[invitations] UUID invitation accepted. invitation_id=%, organization_id=%, user_id=%',
    invitation.id, invitation.organization_id, auth.uid();

  return invitation.organization_id;
end;
$$;

grant execute on function public.accept_organization_invitation(uuid) to authenticated;

create or replace function public.accept_organization_invitation_by_token(p_token text)
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
  where token = p_token
    and status = 'pending'
    and lower(email) = current_email
    and (expires_at is null or expires_at > now())
  limit 1;

  if invitation.id is null then
    raise exception 'Invitation is not available for this account.';
  end if;

  raise log '[invitations] Accepting token invitation. invitation_id=%, organization_id=%, user_id=%',
    invitation.id, invitation.organization_id, auth.uid();

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (invitation.organization_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (organization_id, user_id)
  do update set
    role = excluded.role,
    invited_by = excluded.invited_by;

  perform public.ensure_organization_member_profile(
    invitation.organization_id,
    auth.uid(),
    invitation.invited_by,
    invitation.invited_name
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

  raise log '[invitations] Token invitation accepted. invitation_id=%, organization_id=%, user_id=%',
    invitation.id, invitation.organization_id, auth.uid();

  return invitation.organization_id;
end;
$$;

grant execute on function public.accept_organization_invitation_by_token(text) to authenticated;

insert into public.members (organization_id, name, status, type, email, created_by)
select
  invitations.organization_id,
  case
    when char_length(resolved.resolved_name) >= 2 then left(resolved.resolved_name, 120)
    else 'New member'
  end,
  'active',
  'other',
  lower(users.email),
  invitations.invited_by
from public.organization_invitations invitations
join auth.users users on users.id = invitations.accepted_by
join public.organization_members memberships
  on memberships.organization_id = invitations.organization_id
  and memberships.user_id = invitations.accepted_by
cross join lateral (
  select coalesce(
    nullif(trim(invitations.invited_name), ''),
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
    split_part(users.email, '@', 1),
    'New member'
  ) as resolved_name
) resolved
where invitations.status = 'accepted'
  and invitations.accepted_by is not null
  and users.email is not null
  and not exists (
    select 1
    from public.members existing_members
    where existing_members.organization_id = invitations.organization_id
      and lower(existing_members.email) = lower(users.email)
  );

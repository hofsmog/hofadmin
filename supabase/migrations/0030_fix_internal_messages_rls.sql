create or replace function public.is_organization_member(
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
  );
$$;

grant execute on function public.is_organization_member(uuid, uuid) to authenticated;

create or replace function public.are_organization_team_members(
  p_organization_id uuid,
  p_sender_user_id uuid,
  p_recipient_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_organization_member(p_organization_id, p_sender_user_id)
    and public.is_organization_member(p_organization_id, p_recipient_user_id);
$$;

grant execute on function public.are_organization_team_members(uuid, uuid, uuid) to authenticated;

drop policy if exists "Members can read their internal messages" on public.internal_messages;
create policy "Members can read their internal messages"
  on public.internal_messages for select
  using (
    auth.uid() is not null
    and public.is_organization_member(organization_id, auth.uid())
    and (
      sender_user_id = auth.uid()
      or recipient_user_id = auth.uid()
    )
  );

drop policy if exists "Members can send internal messages" on public.internal_messages;
create policy "Members can send internal messages"
  on public.internal_messages for insert
  with check (
    auth.uid() is not null
    and sender_user_id = auth.uid()
    and public.are_organization_team_members(
      organization_id,
      sender_user_id,
      recipient_user_id
    )
  );

drop policy if exists "Recipients can mark internal messages read" on public.internal_messages;
create policy "Recipients can mark internal messages read"
  on public.internal_messages for update
  using (
    auth.uid() is not null
    and recipient_user_id = auth.uid()
    and public.is_organization_member(organization_id, auth.uid())
  )
  with check (
    auth.uid() is not null
    and recipient_user_id = auth.uid()
    and public.is_organization_member(organization_id, auth.uid())
  );

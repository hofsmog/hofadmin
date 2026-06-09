create or replace function public.can_reply_to_internal_conversation(
  p_organization_id uuid,
  p_conversation_id uuid,
  p_parent_message_id uuid,
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
    from public.internal_messages messages
    where messages.id = p_parent_message_id
      and messages.organization_id = p_organization_id
      and messages.conversation_id = p_conversation_id
      and public.is_organization_member(messages.organization_id, p_user_id)
      and (
        messages.sender_user_id = p_user_id
        or messages.recipient_user_id = p_user_id
      )
  );
$$;

grant execute on function public.can_reply_to_internal_conversation(uuid, uuid, uuid, uuid) to authenticated;

create or replace function public.is_unused_internal_conversation(
  p_organization_id uuid,
  p_conversation_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1
    from public.internal_messages messages
    where messages.organization_id = p_organization_id
      and messages.conversation_id = p_conversation_id
  );
$$;

grant execute on function public.is_unused_internal_conversation(uuid, uuid) to authenticated;

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
    and (
      (
        parent_message_id is null
        and public.is_unused_internal_conversation(organization_id, conversation_id)
      )
      or (
        parent_message_id is not null
        and public.can_reply_to_internal_conversation(
          organization_id,
          conversation_id,
          parent_message_id,
          auth.uid()
        )
      )
    )
  );

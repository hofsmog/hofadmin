create or replace function public.can_add_internal_message_attachment(
  p_message_id uuid,
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
    from public.internal_messages messages
    where messages.id = p_message_id
      and messages.organization_id = p_organization_id
      and messages.sender_user_id = p_user_id
      and public.is_organization_member(messages.organization_id, p_user_id)
  );
$$;

grant execute on function public.can_add_internal_message_attachment(uuid, uuid, uuid) to authenticated;

create or replace function public.is_organization_member_by_text(
  p_organization_id text,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when p_organization_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_organization_member(p_organization_id::uuid, p_user_id)
    else false
  end;
$$;

grant execute on function public.is_organization_member_by_text(text, uuid) to authenticated;

drop policy if exists "Message senders can add attachments" on public.internal_message_attachments;
create policy "Message senders can add attachments"
  on public.internal_message_attachments for insert
  with check (
    auth.uid() is not null
    and uploaded_by = auth.uid()
    and public.can_add_internal_message_attachment(
      message_id,
      organization_id,
      auth.uid()
    )
  );

drop policy if exists "Organization members can upload internal message files" on storage.objects;
create policy "Organization members can upload internal message files"
  on storage.objects for insert
  with check (
    bucket_id = 'internal-message-attachments'
    and (storage.foldername(name))[1] = 'organizations'
    and public.is_organization_member_by_text((storage.foldername(name))[2], auth.uid())
  );

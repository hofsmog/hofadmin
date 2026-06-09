alter table public.internal_messages
  add column if not exists conversation_id uuid,
  add column if not exists parent_message_id uuid references public.internal_messages(id) on delete set null;

update public.internal_messages
set conversation_id = id
where conversation_id is null;

alter table public.internal_messages
  alter column conversation_id set default gen_random_uuid(),
  alter column conversation_id set not null;

create index if not exists internal_messages_conversation_idx
  on public.internal_messages(organization_id, conversation_id, created_at);

create index if not exists internal_messages_parent_idx
  on public.internal_messages(parent_message_id);

create table if not exists public.internal_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.internal_messages(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null check (file_size > 0),
  mime_type text,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists internal_message_attachments_message_idx
  on public.internal_message_attachments(message_id, created_at);

create index if not exists internal_message_attachments_organization_idx
  on public.internal_message_attachments(organization_id, created_at desc);

alter table public.internal_message_attachments enable row level security;

create or replace function public.can_access_internal_message(
  p_message_id uuid,
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
      and public.is_organization_member(messages.organization_id, p_user_id)
      and (
        messages.sender_user_id = p_user_id
        or messages.recipient_user_id = p_user_id
      )
  );
$$;

grant execute on function public.can_access_internal_message(uuid, uuid) to authenticated;

drop policy if exists "Message participants can read attachments" on public.internal_message_attachments;
create policy "Message participants can read attachments"
  on public.internal_message_attachments for select
  using (
    auth.uid() is not null
    and public.can_access_internal_message(message_id, auth.uid())
  );

drop policy if exists "Message senders can add attachments" on public.internal_message_attachments;
create policy "Message senders can add attachments"
  on public.internal_message_attachments for insert
  with check (
    auth.uid() is not null
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.internal_messages messages
      where messages.id = internal_message_attachments.message_id
        and messages.organization_id = internal_message_attachments.organization_id
        and messages.sender_user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('internal-message-attachments', 'internal-message-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Organization members can upload internal message files" on storage.objects;
create policy "Organization members can upload internal message files"
  on storage.objects for insert
  with check (
    bucket_id = 'internal-message-attachments'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Message participants can read internal message files" on storage.objects;
create policy "Message participants can read internal message files"
  on storage.objects for select
  using (
    bucket_id = 'internal-message-attachments'
    and exists (
      select 1
      from public.internal_message_attachments attachments
      where attachments.file_path = storage.objects.name
        and public.can_access_internal_message(attachments.message_id, auth.uid())
    )
  );

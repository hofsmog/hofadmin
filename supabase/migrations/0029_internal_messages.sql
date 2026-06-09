create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  sender_email text not null,
  recipient_email text not null,
  subject text not null check (char_length(subject) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists internal_messages_inbox_idx
  on public.internal_messages(organization_id, recipient_user_id, created_at desc);

create index if not exists internal_messages_sent_idx
  on public.internal_messages(organization_id, sender_user_id, created_at desc);

create index if not exists internal_messages_unread_idx
  on public.internal_messages(organization_id, recipient_user_id, read_at)
  where read_at is null;

alter table public.internal_messages enable row level security;

drop policy if exists "Members can read their internal messages" on public.internal_messages;
create policy "Members can read their internal messages"
  on public.internal_messages for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = internal_messages.organization_id
        and members.user_id = auth.uid()
    )
    and (
      sender_user_id = auth.uid()
      or recipient_user_id = auth.uid()
    )
  );

drop policy if exists "Members can send internal messages" on public.internal_messages;
create policy "Members can send internal messages"
  on public.internal_messages for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.organization_members sender
      where sender.organization_id = internal_messages.organization_id
        and sender.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.organization_members recipient
      where recipient.organization_id = internal_messages.organization_id
        and recipient.user_id = internal_messages.recipient_user_id
    )
  );

drop policy if exists "Recipients can mark internal messages read" on public.internal_messages;
create policy "Recipients can mark internal messages read"
  on public.internal_messages for update
  using (
    recipient_user_id = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = internal_messages.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    recipient_user_id = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = internal_messages.organization_id
        and members.user_id = auth.uid()
    )
  );

create or replace function public.prevent_internal_message_content_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    new.id <> old.id
    or new.organization_id <> old.organization_id
    or new.sender_user_id <> old.sender_user_id
    or new.recipient_user_id <> old.recipient_user_id
    or new.sender_email <> old.sender_email
    or new.recipient_email <> old.recipient_email
    or new.subject <> old.subject
    or new.body <> old.body
    or new.created_at <> old.created_at
  then
    raise exception 'Only read status can be updated for internal messages.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_internal_message_content_update on public.internal_messages;
create trigger prevent_internal_message_content_update
  before update on public.internal_messages
  for each row
  execute function public.prevent_internal_message_content_update();

create or replace function public.list_organization_team_members(p_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.organization_role,
  joined_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    members.user_id,
    users.email,
    members.role,
    members.joined_at
  from public.organization_members members
  join auth.users users on users.id = members.user_id
  where members.organization_id = p_organization_id
    and exists (
      select 1
      from public.organization_members current_member
      where current_member.organization_id = p_organization_id
        and current_member.user_id = auth.uid()
    )
  order by users.email;
$$;

grant execute on function public.list_organization_team_members(uuid) to authenticated;

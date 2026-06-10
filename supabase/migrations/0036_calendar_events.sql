create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  event_type text not null default 'event',
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  source_type text,
  source_id uuid,
  visibility text not null default 'assigned' check (visibility in ('assigned', 'organization')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create index if not exists calendar_events_org_start_idx
  on public.calendar_events(organization_id, start_at);

create index if not exists calendar_events_assigned_start_idx
  on public.calendar_events(organization_id, assigned_to, start_at);

create index if not exists calendar_events_visibility_start_idx
  on public.calendar_events(organization_id, visibility, start_at);

alter table public.calendar_events enable row level security;

drop policy if exists "Members can read visible calendar events" on public.calendar_events;
create policy "Members can read visible calendar events"
  on public.calendar_events for select
  using (
    auth.uid() is not null
    and public.is_organization_member(organization_id, auth.uid())
    and (
      visibility = 'organization'
      or assigned_to = auth.uid()
      or exists (
        select 1
        from public.organization_members members
        where members.organization_id = calendar_events.organization_id
          and members.user_id = auth.uid()
          and members.role in ('owner', 'admin')
      )
    )
  );

drop policy if exists "Owners and admins can create calendar events" on public.calendar_events;
create policy "Owners and admins can create calendar events"
  on public.calendar_events for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = calendar_events.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
    and (
      assigned_to is null
      or public.is_organization_member(organization_id, assigned_to)
    )
  );

drop policy if exists "Owners and admins can update calendar events" on public.calendar_events;
create policy "Owners and admins can update calendar events"
  on public.calendar_events for update
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = calendar_events.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = calendar_events.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
    and (
      assigned_to is null
      or public.is_organization_member(organization_id, assigned_to)
    )
  );

drop policy if exists "Owners and admins can delete calendar events" on public.calendar_events;
create policy "Owners and admins can delete calendar events"
  on public.calendar_events for delete
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = calendar_events.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create or replace function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_calendar_event_updated_at on public.calendar_events;
create trigger set_calendar_event_updated_at
  before update on public.calendar_events
  for each row
  execute function public.set_calendar_event_updated_at();

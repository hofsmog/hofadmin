create type public.activity_event_type as enum (
  'qr_created',
  'checkin_created',
  'member_invited',
  'organization_updated'
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.activity_event_type not null,
  title text not null check (char_length(title) between 2 and 160),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index activity_events_organization_id_created_at_idx
  on public.activity_events(organization_id, created_at desc);

alter table public.activity_events enable row level security;

create policy "Organization members can read activity events"
  on public.activity_events for select
  using (
    exists (
      select 1
      from public.organization_members members
      where members.organization_id = activity_events.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create activity events"
  on public.activity_events for insert
  with check (
    actor_id = auth.uid()
    and exists (
      select 1
      from public.organization_members members
      where members.organization_id = activity_events.organization_id
        and members.user_id = auth.uid()
    )
  );

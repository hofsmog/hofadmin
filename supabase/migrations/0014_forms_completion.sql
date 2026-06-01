-- Forms V1 completion: multi-choice fields and internal submission notes.

alter type public.form_field_type add value if not exists 'radio';

create table if not exists public.submission_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists submission_notes_organization_submission_created_idx
  on public.submission_notes(organization_id, submission_id, created_at desc);

alter table public.submission_notes enable row level security;

create policy "Organization members can read submission notes"
  on public.submission_notes for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = submission_notes.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create submission notes"
  on public.submission_notes for insert
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = submission_notes.organization_id
        and members.user_id = auth.uid()
    )
  );

alter type public.activity_event_type add value if not exists 'form_submission_received';
alter type public.activity_event_type add value if not exists 'form_submission_read';
alter type public.activity_event_type add value if not exists 'form_submission_handling_changed';

alter table public.form_submissions
  add column if not exists read_status text not null default 'new'
    check (read_status in ('new', 'read')),
  add column if not exists handling_status text not null default 'unhandled'
    check (handling_status in ('unhandled', 'partially_handled', 'handled', 'archived')),
  add column if not exists handled_note text,
  add column if not exists handled_by uuid references auth.users(id) on delete set null,
  add column if not exists handled_at timestamptz;

create index if not exists form_submissions_organization_read_status_idx
  on public.form_submissions(organization_id, read_status, created_at desc);

create index if not exists form_submissions_organization_handling_status_idx
  on public.form_submissions(organization_id, handling_status, created_at desc);

drop policy if exists "Organization members can update form submissions" on public.form_submissions;
create policy "Organization members can update form submissions"
  on public.form_submissions for update
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submissions.organization_id
        and members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submissions.organization_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Public users can submit active forms" on public.form_submissions;
create policy "Public users can submit active forms"
  on public.form_submissions for insert
  with check (
    submitted_by is null
    and read_status = 'new'
    and handling_status = 'unhandled'
    and handled_note is null
    and handled_by is null
    and handled_at is null
    and exists (
      select 1
      from public.forms parent_form
      where parent_form.id = form_submissions.form_id
        and parent_form.organization_id = form_submissions.organization_id
        and parent_form.status = 'active'
    )
  );

create or replace function public.record_form_submission_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  form_title text;
begin
  select title into form_title
  from public.forms
  where id = new.form_id;

  insert into public.activity_events (
    organization_id,
    type,
    title,
    description,
    metadata,
    actor_id
  )
  values (
    new.organization_id,
    'form_submission_received',
    'Form submission received',
    coalesce(form_title, 'A form') || ' received a new response.',
    jsonb_build_object('submission_id', new.id, 'form_id', new.form_id),
    new.submitted_by
  );

  return new;
end;
$$;

drop trigger if exists on_form_submission_received on public.form_submissions;
create trigger on_form_submission_received
  after insert on public.form_submissions
  for each row execute function public.record_form_submission_activity();

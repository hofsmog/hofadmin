alter type public.form_status add value if not exists 'published';

alter table public.forms
  add column if not exists enable_email_notifications boolean not null default false,
  add column if not exists notification_emails text[] not null default '{}'::text[];

update public.forms
set status = 'published'
where status = 'active';

drop policy if exists "Anyone can read active public forms" on public.forms;
create policy "Anyone can read published public forms"
  on public.forms for select
  using (status = 'published');

drop policy if exists "Anyone can read fields for active public forms" on public.form_fields;
create policy "Anyone can read fields for published public forms"
  on public.form_fields for select
  using (
    exists (
      select 1
      from public.forms parent_form
      where parent_form.id = form_fields.form_id
        and parent_form.organization_id = form_fields.organization_id
        and parent_form.status = 'published'
    )
  );

drop policy if exists "Anyone can submit active public forms" on public.form_submissions;
drop policy if exists "Public users can submit active forms" on public.form_submissions;
create policy "Anyone can submit published public forms"
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
        and parent_form.status = 'published'
    )
  );

drop policy if exists "Anyone can add values for active public submissions" on public.form_submission_values;
create policy "Anyone can add values for published public submissions"
  on public.form_submission_values for insert
  with check (
    exists (
      select 1
      from public.form_submissions submission
      join public.forms parent_form on parent_form.id = submission.form_id
      where submission.id = form_submission_values.submission_id
        and submission.organization_id = form_submission_values.organization_id
        and parent_form.organization_id = form_submission_values.organization_id
        and parent_form.status = 'published'
    )
    and (
      field_id is null
      or exists (
        select 1
        from public.form_fields field
        join public.form_submissions submission on submission.id = form_submission_values.submission_id
        where field.id = form_submission_values.field_id
          and field.organization_id = form_submission_values.organization_id
          and field.form_id = submission.form_id
      )
    )
  );

drop policy if exists "Public can read branding for active public forms" on public.organizations;
drop policy if exists "Public can read branding for published public forms" on public.organizations;
create policy "Public can read branding for published public forms"
  on public.organizations for select
  using (
    public_branding_enabled = true
    and exists (
      select 1 from public.forms
      where forms.organization_id = organizations.id
        and forms.status = 'published'
    )
  );

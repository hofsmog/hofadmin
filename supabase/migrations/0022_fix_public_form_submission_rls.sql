-- Make public published form submissions work without weakening organization isolation.

drop policy if exists "Anyone can submit published public forms" on public.form_submissions;
create policy "Anyone can submit published public forms"
  on public.form_submissions for insert
  with check (
    submitted_by is null
    and coalesce(read_status, 'new') = 'new'
    and coalesce(handling_status, 'unhandled') = 'unhandled'
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

drop policy if exists "Anyone can add values for published public submissions" on public.form_submission_values;
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
        and submission.submitted_by is null
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

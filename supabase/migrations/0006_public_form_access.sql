create policy "Anyone can read active public forms"
  on public.forms for select
  using (status = 'active');

create policy "Anyone can read fields for active public forms"
  on public.form_fields for select
  using (
    exists (
      select 1
      from public.forms parent_form
      where parent_form.id = form_fields.form_id
        and parent_form.organization_id = form_fields.organization_id
        and parent_form.status = 'active'
    )
  );

create policy "Anyone can submit active public forms"
  on public.form_submissions for insert
  with check (
    submitted_by is null
    and exists (
      select 1
      from public.forms parent_form
      where parent_form.id = form_submissions.form_id
        and parent_form.organization_id = form_submissions.organization_id
        and parent_form.status = 'active'
    )
  );

create policy "Anyone can add values for active public submissions"
  on public.form_submission_values for insert
  with check (
    exists (
      select 1
      from public.form_submissions submission
      join public.forms parent_form on parent_form.id = submission.form_id
      where submission.id = form_submission_values.submission_id
        and submission.organization_id = form_submission_values.organization_id
        and parent_form.organization_id = form_submission_values.organization_id
        and parent_form.status = 'active'
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

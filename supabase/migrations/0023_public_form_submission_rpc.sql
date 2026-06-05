-- Atomic public form submission RPC.
-- This avoids anonymous clients needing SELECT on form_submissions just to insert answer values.

create or replace function public.submit_public_form_response(
  p_slug text,
  p_submission_id uuid,
  p_submitter_email text,
  p_metadata jsonb,
  p_values jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_form public.forms;
  answer jsonb;
  answer_field_id uuid;
  answer_field public.form_fields;
begin
  select *
    into target_form
  from public.forms
  where slug = p_slug
    and status = 'published'
  limit 1;

  if target_form.id is null then
    raise exception 'Published form not found.';
  end if;

  if p_values is null or jsonb_typeof(p_values) <> 'array' then
    raise exception 'Submission values must be an array.';
  end if;

  insert into public.form_submissions (
    id,
    organization_id,
    form_id,
    submitted_by,
    submitter_email,
    read_status,
    handling_status,
    handled_note,
    handled_by,
    handled_at,
    metadata
  )
  values (
    p_submission_id,
    target_form.organization_id,
    target_form.id,
    null,
    nullif(trim(p_submitter_email), ''),
    'new',
    'unhandled',
    null,
    null,
    null,
    coalesce(p_metadata, '{}'::jsonb)
  );

  for answer in select * from jsonb_array_elements(p_values)
  loop
    answer_field_id := nullif(answer->>'field_id', '')::uuid;

    if answer_field_id is null then
      raise exception 'Submission value is missing field_id.';
    end if;

    select *
      into answer_field
    from public.form_fields
    where id = answer_field_id
      and form_id = target_form.id
      and organization_id = target_form.organization_id;

    if answer_field.id is null then
      raise exception 'Submission value references an invalid field.';
    end if;

    insert into public.form_submission_values (
      organization_id,
      submission_id,
      field_id,
      field_label,
      value
    )
    values (
      target_form.organization_id,
      p_submission_id,
      answer_field.id,
      answer_field.label,
      answer->>'value'
    );
  end loop;

  return p_submission_id;
end;
$$;

grant execute on function public.submit_public_form_response(text, uuid, text, jsonb, jsonb) to anon, authenticated;

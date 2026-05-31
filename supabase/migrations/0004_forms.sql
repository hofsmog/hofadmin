create type public.form_status as enum ('draft', 'active', 'archived');
create type public.form_field_type as enum (
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'checkbox'
);

alter type public.activity_event_type add value if not exists 'form_created';

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  description text,
  status public.form_status not null default 'draft',
  slug text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  field_type public.form_field_type not null,
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  submitter_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.form_submission_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  field_id uuid references public.form_fields(id) on delete set null,
  field_label text not null,
  value text,
  created_at timestamptz not null default now()
);

create index forms_organization_id_created_at_idx on public.forms(organization_id, created_at desc);
create index form_fields_form_id_sort_order_idx on public.form_fields(form_id, sort_order);
create index form_submissions_organization_id_created_at_idx on public.form_submissions(organization_id, created_at desc);
create index form_submissions_form_id_idx on public.form_submissions(form_id);
create index form_submission_values_submission_id_idx on public.form_submission_values(submission_id);

alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_submissions enable row level security;
alter table public.form_submission_values enable row level security;

create policy "Organization members can read forms"
  on public.forms for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = forms.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create forms"
  on public.forms for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = forms.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can update forms"
  on public.forms for update
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = forms.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = forms.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

create policy "Organization members can read form fields"
  on public.form_fields for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_fields.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create form fields"
  on public.form_fields for insert
  with check (
    exists (
      select 1 from public.forms parent_form
      where parent_form.id = form_fields.form_id
        and parent_form.organization_id = form_fields.organization_id
    )
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = form_fields.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can read form submissions"
  on public.form_submissions for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submissions.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create form submissions"
  on public.form_submissions for insert
  with check (
    exists (
      select 1 from public.forms parent_form
      where parent_form.id = form_submissions.form_id
        and parent_form.organization_id = form_submissions.organization_id
    )
    and (
      submitted_by is null
      or submitted_by = auth.uid()
    )
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submissions.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can read form submission values"
  on public.form_submission_values for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submission_values.organization_id
        and members.user_id = auth.uid()
    )
  );

create policy "Organization members can create form submission values"
  on public.form_submission_values for insert
  with check (
    exists (
      select 1 from public.form_submissions submission
      where submission.id = form_submission_values.submission_id
        and submission.organization_id = form_submission_values.organization_id
    )
    and exists (
      select 1 from public.organization_members members
      where members.organization_id = form_submission_values.organization_id
        and members.user_id = auth.uid()
    )
  );

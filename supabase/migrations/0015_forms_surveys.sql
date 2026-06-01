-- Survey support inside Forms.

alter table public.forms
  add column if not exists form_type text not null default 'form'
    check (form_type in ('form', 'survey')),
  add column if not exists anonymous_responses boolean not null default false;

alter type public.form_field_type add value if not exists 'scale_1_5';
alter type public.form_field_type add value if not exists 'scale_1_10';
alter type public.form_field_type add value if not exists 'yes_no';

create index if not exists forms_organization_type_status_idx
  on public.forms(organization_id, form_type, status, created_at desc);

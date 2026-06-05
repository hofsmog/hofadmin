-- Resend email delivery logs and notification preference expansion.

alter table public.organization_notification_preferences
  add column if not exists notify_new_fault_report boolean not null default true,
  add column if not exists notify_booking_request boolean not null default true,
  add column if not exists notify_policy_acknowledgement_reminder boolean not null default true,
  add column if not exists notify_contract_expiration_reminder boolean not null default true,
  add column if not exists notify_training_expiration_reminder boolean not null default true;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_email text not null,
  subject text not null,
  event_type text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider text not null default 'resend',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_organization_created_idx
  on public.email_logs(organization_id, created_at desc);

create index if not exists email_logs_organization_event_idx
  on public.email_logs(organization_id, event_type, created_at desc);

alter table public.email_logs enable row level security;

drop policy if exists "Organization members can read email logs" on public.email_logs;
create policy "Organization members can read email logs"
  on public.email_logs for select
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = email_logs.organization_id
        and members.user_id = auth.uid()
    )
  );

drop function if exists public.log_email_delivery(uuid, text, text, text, text, text, text);
create or replace function public.log_email_delivery(
  p_organization_id uuid,
  p_recipient_email text,
  p_subject text,
  p_event_type text,
  p_status text,
  p_provider_message_id text default null,
  p_error_message text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if p_status not in ('pending', 'sent', 'failed') then
    raise exception 'Invalid email status';
  end if;

  insert into public.email_logs (
    organization_id,
    recipient_email,
    subject,
    event_type,
    status,
    provider,
    provider_message_id,
    error_message
  )
  values (
    p_organization_id,
    lower(trim(p_recipient_email)),
    p_subject,
    p_event_type,
    p_status,
    'resend',
    p_provider_message_id,
    p_error_message
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.log_email_delivery(uuid, text, text, text, text, text, text) to anon, authenticated;

create type public.organization_plan as enum ('free', 'starter', 'growth', 'enterprise');
create type public.billing_status as enum ('active', 'trialing', 'past_due', 'canceled', 'none');

alter table public.organizations
  add column if not exists plan public.organization_plan not null default 'free',
  add column if not exists member_limit integer,
  add column if not exists module_limit integer,
  add column if not exists enabled_modules text[] not null default '{}'::text[],
  add column if not exists billing_status public.billing_status not null default 'none',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists custom_branding_enabled boolean not null default false,
  add column if not exists email_notifications_enabled boolean not null default false;

update public.organizations
set
  member_limit = coalesce(member_limit, 50),
  module_limit = coalesce(module_limit, 2),
  enabled_modules = case
    when coalesce(array_length(enabled_modules, 1), 0) > 0 then enabled_modules[1:2]
    when coalesce(array_length(starter_modules, 1), 0) > 0 then starter_modules[1:2]
    else array['members', 'forms']::text[]
  end
where plan = 'free';

update public.organizations
set
  member_limit = coalesce(member_limit, 500),
  module_limit = coalesce(module_limit, 5),
  email_notifications_enabled = true,
  enabled_modules = case
    when coalesce(array_length(enabled_modules, 1), 0) > 0 then enabled_modules[1:5]
    when coalesce(array_length(starter_modules, 1), 0) > 0 then starter_modules[1:5]
    else array['members', 'forms', 'inventory', 'loans', 'qr-checkins']::text[]
  end
where plan = 'starter';

update public.organizations
set
  member_limit = coalesce(member_limit, 2500),
  module_limit = null,
  email_notifications_enabled = true,
  custom_branding_enabled = true
where plan = 'growth';

update public.organizations
set
  member_limit = null,
  module_limit = null,
  email_notifications_enabled = true,
  custom_branding_enabled = true
where plan = 'enterprise';

alter table public.organizations
  alter column member_limit set default 50,
  alter column module_limit set default 2;

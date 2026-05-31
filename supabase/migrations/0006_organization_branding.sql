alter table public.organizations
  add column if not exists favicon_url text,
  add column if not exists background_color text default '#f8fafc'
    check (background_color is null or background_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists sidebar_style text not null default 'system'
    check (sidebar_style in ('light', 'dark', 'system')),
  add column if not exists public_branding_enabled boolean not null default true,
  add column if not exists custom_welcome_message text check (
    custom_welcome_message is null or char_length(custom_welcome_message) <= 240
  ),
  add column if not exists support_email text,
  add column if not exists website_url text;

drop policy if exists "Public can read branding for active public forms" on public.organizations;
create policy "Public can read branding for active public forms"
  on public.organizations for select
  using (
    public_branding_enabled = true
    and exists (
      select 1 from public.forms
      where forms.organization_id = organizations.id
        and forms.status = 'active'
    )
  );

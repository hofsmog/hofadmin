alter table public.forms
  add column if not exists accent_color text not null default '#2563eb'
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists background_color text not null default '#f8fafc'
    check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists text_color text not null default '#111827'
    check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists button_color text not null default '#111827'
    check (button_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists button_text_color text not null default '#ffffff'
    check (button_text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists font_style text not null default 'default'
    check (font_style in ('default', 'modern', 'classic', 'playful')),
  add column if not exists form_layout text not null default 'card'
    check (form_layout in ('card', 'full-width', 'minimal')),
  add column if not exists corner_radius text not null default 'medium'
    check (corner_radius in ('none', 'small', 'medium', 'large')),
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists custom_thank_you_message text check (
    custom_thank_you_message is null or char_length(custom_thank_you_message) <= 240
  );

drop policy if exists "Owners and admins can update form fields" on public.form_fields;
create policy "Owners and admins can update form fields"
  on public.form_fields for update
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_fields.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_fields.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

drop policy if exists "Owners and admins can delete form fields" on public.form_fields;
create policy "Owners and admins can delete form fields"
  on public.form_fields for delete
  using (
    exists (
      select 1 from public.organization_members members
      where members.organization_id = form_fields.organization_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'admin')
    )
  );

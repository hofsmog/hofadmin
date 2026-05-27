alter type public.activity_event_type add value if not exists 'module_opened';
alter type public.activity_event_type add value if not exists 'module_enabled';

alter table public.organizations
  add column if not exists display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  add column if not exists logo_url text,
  add column if not exists accent_color text check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');

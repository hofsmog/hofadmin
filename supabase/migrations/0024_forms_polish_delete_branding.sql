-- Forms polish: public form logo assets.
-- Form deletion uses the existing archived status so submissions remain available.

insert into storage.buckets (id, name, public)
values ('form-public-assets', 'form-public-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Organization members can upload form public assets" on storage.objects;
create policy "Organization members can upload form public assets"
  on storage.objects for insert
  with check (
    bucket_id = 'form-public-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "Organization members can update form public assets" on storage.objects;
create policy "Organization members can update form public assets"
  on storage.objects for update
  using (
    bucket_id = 'form-public-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'form-public-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and exists (
      select 1 from public.organization_members members
      where members.organization_id::text = (storage.foldername(name))[2]
        and members.user_id = auth.uid()
    )
  );

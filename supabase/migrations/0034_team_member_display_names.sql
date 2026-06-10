drop function if exists public.list_organization_team_members(uuid);

create function public.list_organization_team_members(p_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role public.organization_role,
  joined_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    members.user_id,
    users.email,
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(
        trim(
          coalesce(users.raw_user_meta_data ->> 'first_name', '') ||
          ' ' ||
          coalesce(users.raw_user_meta_data ->> 'last_name', '')
        ),
        ''
      ),
      nullif(trim(users.raw_user_meta_data ->> 'name'), '')
    ) as display_name,
    members.role,
    members.joined_at
  from public.organization_members members
  join auth.users users on users.id = members.user_id
  where members.organization_id = p_organization_id
    and public.is_organization_member(p_organization_id, auth.uid())
  order by display_name nulls last, users.email;
$$;

grant execute on function public.list_organization_team_members(uuid) to authenticated;

-- Phase 5: fix invite RPC output-column ambiguity in PL/pgSQL

drop function if exists public.invite_budget_member_by_email(uuid, text, public.budget_role);

create function public.invite_budget_member_by_email(
  target_budget_id uuid,
  target_email text,
  target_role public.budget_role default 'guest'
)
returns table (
  member_user_id uuid,
  member_role public.budget_role,
  member_email text,
  member_first_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  resolved_user_id uuid;
begin
  if not public.has_budget_role(
    target_budget_id,
    array['owner', 'admin']::public.budget_role[]
  ) then
    raise exception 'You do not have permission to add budget members.';
  end if;

  if target_role = 'owner' then
    raise exception 'Cannot add owner role via invitation.';
  end if;

  normalized_email = lower(trim(target_email));
  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required.';
  end if;

  select au.id
  into resolved_user_id
  from auth.users au
  where lower(au.email) = normalized_email
  limit 1;

  if resolved_user_id is null then
    raise exception 'No user found for this email.';
  end if;

  insert into public.budget_members (budget_id, user_id, role, invited_by)
  values (target_budget_id, resolved_user_id, target_role, auth.uid())
  on conflict (budget_id, user_id) do update
  set role = excluded.role,
      invited_by = excluded.invited_by,
      updated_at = now();

  return query
  select
    bm.user_id as member_user_id,
    bm.role as member_role,
    au.email::text as member_email,
    coalesce(au.raw_user_meta_data ->> 'first_name', '') as member_first_name
  from public.budget_members bm
  left join auth.users au on au.id = bm.user_id
  where bm.budget_id = target_budget_id
    and bm.user_id = resolved_user_id
  limit 1;
end;
$$;

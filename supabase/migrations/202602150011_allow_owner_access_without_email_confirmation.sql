-- Phase 11: preserve owner access even without email_confirmed_at
-- Keep pending invitees blocked, but never lock out canonical owners.

create or replace function public.has_budget_role(
  target_budget_id uuid,
  allowed_roles public.budget_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.budget_members bm
    join auth.users au on au.id = bm.user_id
    where bm.budget_id = target_budget_id
      and bm.user_id = auth.uid()
      and bm.role = any (allowed_roles)
      and (
        bm.role = 'owner'
        or au.email_confirmed_at is not null
      )
  );
$$;

create or replace function public.list_budget_member_identities(target_budget_id uuid)
returns table (
  user_id uuid,
  role public.budget_role,
  email text,
  first_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    bm.user_id,
    bm.role,
    au.email,
    coalesce(au.raw_user_meta_data ->> 'first_name', '')
  from public.budget_members bm
  join auth.users au on au.id = bm.user_id
  where bm.budget_id = target_budget_id
    and (
      bm.role = 'owner'
      or au.email_confirmed_at is not null
    )
    and public.has_budget_role(
      target_budget_id,
      array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
    )
  order by bm.created_at asc;
$$;

drop policy if exists budgets_select on public.budgets;
create policy budgets_select
on public.budgets
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.budget_members bm
    join auth.users au on au.id = bm.user_id
    where bm.budget_id = budgets.id
      and bm.user_id = auth.uid()
      and bm.role = any (array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[])
      and (
        bm.role = 'owner'
        or au.email_confirmed_at is not null
      )
  )
);

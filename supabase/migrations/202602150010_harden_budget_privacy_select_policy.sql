-- Phase 10: harden budget privacy at table policy level
-- Budgets are visible only to:
-- 1) the creator/owner (budgets.user_id), or
-- 2) confirmed collaborators in budget_members

alter table public.budgets enable row level security;
alter table public.budgets force row level security;

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
      and au.email_confirmed_at is not null
  )
);

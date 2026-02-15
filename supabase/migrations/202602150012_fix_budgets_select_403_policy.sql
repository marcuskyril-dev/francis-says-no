-- Phase 12: fix 403 from budgets_select policy by avoiding direct auth.users access

drop policy if exists budgets_select on public.budgets;
create policy budgets_select
on public.budgets
for select
using (
  user_id = auth.uid()
  or public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
  )
);

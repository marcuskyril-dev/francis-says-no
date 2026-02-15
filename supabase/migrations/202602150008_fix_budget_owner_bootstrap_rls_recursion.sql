-- Phase 8: fix owner bootstrap insert policy recursion on budgets RLS

drop policy if exists budget_members_insert on public.budget_members;

create policy budget_members_insert
on public.budget_members
for insert
with check (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
  or (
    role = 'owner'
    and user_id = auth.uid()
    and public.get_budget_owner_user_id(budget_id) = auth.uid()
  )
);

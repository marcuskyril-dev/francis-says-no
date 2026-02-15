-- Phase 7: allow budget creator owner-membership bootstrap

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
    and exists (
      select 1
      from public.budgets b
      where b.id = budget_members.budget_id
        and b.user_id = auth.uid()
    )
  )
);

-- Phase 13: remove overly broad authenticated policy that bypasses RLS intent
-- Postgres combines permissive policies with OR. A blanket authenticated policy
-- makes all stricter policies ineffective for matching commands.

drop policy if exists "Allow all operations for authenticated users" on public.budgets;
drop policy if exists "Allow all operations for authenticated users" on public.zones;
drop policy if exists "Allow all operations for authenticated users" on public.wishlist_items;
drop policy if exists "Allow all operations for authenticated users" on public.expenses;
drop policy if exists "Allow all operations for authenticated users" on public.budget_members;

-- Reassert strict budget policies after removing the broad policy.
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

drop policy if exists budgets_insert on public.budgets;
create policy budgets_insert
on public.budgets
for insert
with check (user_id = auth.uid());

drop policy if exists budgets_update on public.budgets;
create policy budgets_update
on public.budgets
for update
using (
  public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
)
with check (
  public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
  and (
    public.has_budget_role(
      id,
      array['owner', 'admin']::public.budget_role[]
    )
    or user_id = public.get_budget_owner_user_id(id)
  )
);

drop policy if exists budgets_delete on public.budgets;
create policy budgets_delete
on public.budgets
for delete
using (
  public.has_budget_role(
    id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists expenses_owner_all on public.expenses;
drop policy if exists expenses_select on public.expenses;
drop policy if exists expenses_insert on public.expenses;
drop policy if exists expenses_update on public.expenses;
drop policy if exists expenses_delete on public.expenses;

drop policy if exists expense_payment_milestones_select on public.expense_payment_milestones;
drop policy if exists expense_payment_milestones_insert on public.expense_payment_milestones;
drop policy if exists expense_payment_milestones_update on public.expense_payment_milestones;
drop policy if exists expense_payment_milestones_delete on public.expense_payment_milestones;

drop policy if exists expense_payments_select on public.expense_payments;
drop policy if exists expense_payments_insert on public.expense_payments;
drop policy if exists expense_payments_update on public.expense_payments;
drop policy if exists expense_payments_delete on public.expense_payments;

drop table if exists public.expense_payment_milestones cascade;
drop table if exists public.expense_payments cascade;

drop index if exists idx_expenses_budget_id;

alter table public.expenses
  drop constraint if exists expenses_scope_xor_check,
  drop constraint if exists expenses_contract_fields_required_check;

alter table public.expenses
  drop column if exists budget_id;

create policy expenses_select
on public.expenses
for select
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

create policy expenses_insert
on public.expenses
for insert
with check (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

create policy expenses_update
on public.expenses
for update
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

create policy expenses_delete
on public.expenses
for delete
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

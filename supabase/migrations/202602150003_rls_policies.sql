-- Phase 3: ownership and access control
-- Run only after budgets.user_id has been populated for existing rows.

alter table public.budgets enable row level security;
alter table public.zones enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.expenses enable row level security;

drop policy if exists budgets_owner_all on public.budgets;
create policy budgets_owner_all
on public.budgets
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists zones_owner_all on public.zones;
create policy zones_owner_all
on public.zones
for all
using (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and b.user_id = auth.uid()
  )
);

drop policy if exists wishlist_items_owner_all on public.wishlist_items;
create policy wishlist_items_owner_all
on public.wishlist_items
for all
using (
  exists (
    select 1
    from public.zones z
    join public.budgets b on b.id = z.budget_id
    where z.id = wishlist_items.zone_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.zones z
    join public.budgets b on b.id = z.budget_id
    where z.id = wishlist_items.zone_id
      and b.user_id = auth.uid()
  )
);

drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all
on public.expenses
for all
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    join public.budgets b on b.id = z.budget_id
    where wi.id = expenses.wishlist_item_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    join public.budgets b on b.id = z.budget_id
    where wi.id = expenses.wishlist_item_id
      and b.user_id = auth.uid()
  )
);

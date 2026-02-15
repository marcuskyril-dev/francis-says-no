# Supabase Migration Runbook

## Scope
- Add ownership to `budgets` via `user_id`.
- Add `wishlist_items.status`.
- Introduce canonical `expenses` table.
- Backfill from `purchased_items` using `price`.
- Enable RLS policies by `auth.uid()`.
- Cut frontend from Firebase to Supabase.

## Prerequisites
- Production backup/snapshot taken.
- Staging environment mirrors production schema.
- Supabase Auth enabled and users provisioned.
- Mapping source available for `budgets.id -> auth.users.id`.

## Migration Order
1. Run `supabase/migrations/202602150001_additive_schema.sql`.
2. Backfill ownership:
   - Create a temporary mapping table from your CSV/admin export.
   - Update `budgets.user_id` from the mapping table.
3. Verify no null `user_id` remains:
   - `select count(*) from public.budgets where user_id is null;`
4. Lock ownership constraint:
   - `alter table public.budgets alter column user_id set not null;`
5. Run `supabase/migrations/202602150002_backfill_expenses.sql`.
6. Reconciliation checks (below).
7. Run `supabase/migrations/202602150003_rls_policies.sql`.

## Reconciliation Queries
- Row count parity:
  - `select count(*) from public.purchased_items;`
  - `select count(*) from public.expense_backfill_map;`
- Total parity:
  - `select coalesce(sum(price), 0) from public.purchased_items;`
  - `select coalesce(sum(e.amount), 0) from public.expenses e join public.expense_backfill_map m on m.expense_id = e.id;`
- Item-level parity:
  - `select wishlist_item_id, coalesce(sum(price), 0) as legacy_total from public.purchased_items group by wishlist_item_id order by legacy_total desc;`
  - `select wishlist_item_id, coalesce(sum(amount), 0) as expense_total from public.expenses group by wishlist_item_id order by expense_total desc;`

## Cutover Checklist
- Deploy frontend with Supabase auth/services enabled.
- Confirm authenticated users only see own budgets/zones/items/expenses.
- Confirm dashboard computations use `expenses` source only.
- Keep `purchased_items` read-only for one release.

## Rollback
- If additive migration fails: revert deployment and restore DB snapshot.
- If backfill fails: delete rows inserted in failed window via `expense_backfill_map` join, fix issue, rerun backfill script.
- If RLS blocks expected traffic: disable problematic policy, validate user mapping, reapply corrected policy.

## Post-Stabilization
- After one release and reconciled metrics, deprecate `purchased_items`.
- Preserve this runbook with final execution notes and timestamp.

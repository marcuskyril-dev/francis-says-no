-- Phase 2: deterministic backfill from purchased_items -> expenses
-- Canonical amount mapping: expenses.amount = purchased_items.price

create table if not exists public.expense_backfill_map (
  purchased_item_id uuid primary key references public.purchased_items (id) on delete cascade,
  expense_id uuid not null unique references public.expenses (id) on delete cascade,
  migrated_at timestamp with time zone not null default now()
);

do $$
declare
  source_row record;
  inserted_expense_id uuid;
begin
  for source_row in
    select pi.*
    from public.purchased_items pi
    left join public.expense_backfill_map bm on bm.purchased_item_id = pi.id
    where bm.purchased_item_id is null
    order by pi.created_at nulls last, pi.id
  loop
    insert into public.expenses (
      wishlist_item_id,
      amount,
      description,
      expense_date,
      created_at,
      updated_at
    )
    values (
      source_row.wishlist_item_id,
      source_row.price,
      coalesce(source_row.name, source_row.notes),
      source_row.purchase_date,
      coalesce(source_row.created_at, now()),
      coalesce(source_row.updated_at, now())
    )
    returning id into inserted_expense_id;

    insert into public.expense_backfill_map (purchased_item_id, expense_id)
    values (source_row.id, inserted_expense_id);
  end loop;
end
$$;

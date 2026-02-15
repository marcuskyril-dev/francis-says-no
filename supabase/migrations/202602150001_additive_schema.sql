-- Phase 1: additive migration (safe, backward compatible)
create extension if not exists pgcrypto;

alter table public.budgets
add column if not exists user_id uuid references auth.users (id);

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'wishlist_item_status'
      and n.nspname = 'public'
  ) then
    create type public.wishlist_item_status as enum ('not_started', 'in_progress', 'completed');
  end if;
end
$$;

alter table public.wishlist_items
add column if not exists status public.wishlist_item_status not null default 'not_started';

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid (),
  wishlist_item_id uuid not null references public.wishlist_items (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  description text null,
  expense_date timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_expenses_wishlist_item_id
on public.expenses using btree (wishlist_item_id);

create index if not exists idx_expenses_expense_date
on public.expenses using btree (expense_date);

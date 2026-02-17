drop index if exists public.idx_wishlist_items_installation_date;
drop index if exists public.idx_wishlist_items_delivery_date;
drop index if exists public.idx_expenses_delivery_date;
drop index if exists public.idx_expenses_installation_date;

alter table public.wishlist_items
drop column if exists installation_date,
drop column if exists delivery_date;

alter table public.expenses
drop column if exists delivery_date,
drop column if exists installation_date;

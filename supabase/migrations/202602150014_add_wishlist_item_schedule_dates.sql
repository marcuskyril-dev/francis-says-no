alter table public.wishlist_items
add column if not exists must_purchase_before timestamp with time zone null,
add column if not exists installation_date timestamp with time zone null,
add column if not exists delivery_date timestamp with time zone null;

create index if not exists idx_wishlist_items_must_purchase_before
on public.wishlist_items using btree (must_purchase_before);

create index if not exists idx_wishlist_items_installation_date
on public.wishlist_items using btree (installation_date);

create index if not exists idx_wishlist_items_delivery_date
on public.wishlist_items using btree (delivery_date);

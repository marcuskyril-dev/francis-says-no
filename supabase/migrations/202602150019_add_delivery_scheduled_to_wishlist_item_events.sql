alter table public.wishlist_item_events
add column if not exists delivery_scheduled boolean not null default false;

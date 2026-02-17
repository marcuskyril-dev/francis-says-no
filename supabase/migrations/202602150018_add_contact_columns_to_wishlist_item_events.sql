alter table public.wishlist_item_events
add column if not exists contact_person_name text null,
add column if not exists contact_person_email text null,
add column if not exists contact_person_mobile text null,
add column if not exists company_brand_name text null;

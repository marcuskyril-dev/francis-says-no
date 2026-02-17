update public.wishlist_items as wishlist_item
set status = 'in_progress'
where wishlist_item.status = 'not_started'
  and exists (
    select 1
    from public.expenses as expense
    where expense.wishlist_item_id = wishlist_item.id
  );

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'wishlist_item_event_type'
      and n.nspname = 'public'
  ) then
    create type public.wishlist_item_event_type as enum ('delivery', 'installation');
  end if;
end
$$;

create table if not exists public.wishlist_item_events (
  wishlist_item_id uuid not null references public.wishlist_items (id) on delete cascade,
  event_type public.wishlist_item_event_type not null,
  scheduled_at timestamp with time zone not null,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint wishlist_item_events_pkey primary key (wishlist_item_id, event_type)
);

create index if not exists idx_wishlist_item_events_scheduled_at
on public.wishlist_item_events using btree (scheduled_at);

create index if not exists idx_wishlist_item_events_completed_at
on public.wishlist_item_events using btree (completed_at);

create or replace function public.touch_wishlist_item_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_wishlist_item_events_updated_at on public.wishlist_item_events;
create trigger trg_touch_wishlist_item_events_updated_at
before update on public.wishlist_item_events
for each row
execute function public.touch_wishlist_item_events_updated_at();

alter table public.wishlist_item_events enable row level security;

drop policy if exists wishlist_item_events_select on public.wishlist_item_events;
create policy wishlist_item_events_select
on public.wishlist_item_events
for select
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = wishlist_item_events.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_item_events_insert on public.wishlist_item_events;
create policy wishlist_item_events_insert
on public.wishlist_item_events
for insert
with check (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = wishlist_item_events.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_item_events_update on public.wishlist_item_events;
create policy wishlist_item_events_update
on public.wishlist_item_events
for update
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = wishlist_item_events.wishlist_item_id
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
    where wi.id = wishlist_item_events.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_item_events_delete on public.wishlist_item_events;
create policy wishlist_item_events_delete
on public.wishlist_item_events
for delete
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = wishlist_item_events.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

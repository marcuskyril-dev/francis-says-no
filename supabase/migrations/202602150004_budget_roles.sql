-- Phase 4: role-based budget access control and collaboration

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'budget_role'
      and n.nspname = 'public'
  ) then
    create type public.budget_role as enum ('owner', 'admin', 'maintainer', 'guest');
  end if;
end
$$;

create table if not exists public.budget_members (
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.budget_role not null,
  invited_by uuid null references auth.users (id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint budget_members_pkey primary key (budget_id, user_id)
);

create index if not exists idx_budget_members_user_id
on public.budget_members using btree (user_id);

create index if not exists idx_budget_members_budget_id_role
on public.budget_members using btree (budget_id, role);

create unique index if not exists idx_budget_members_single_owner
on public.budget_members using btree (budget_id)
where role = 'owner';

create or replace function public.touch_budget_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_budget_members_updated_at on public.budget_members;
create trigger trg_touch_budget_members_updated_at
before update on public.budget_members
for each row
execute function public.touch_budget_members_updated_at();

create or replace function public.guard_budget_members_owner_invariants()
returns trigger
language plpgsql
as $$
declare
  canonical_owner_id uuid;
begin
  select b.user_id
  into canonical_owner_id
  from public.budgets b
  where b.id = coalesce(new.budget_id, old.budget_id);

  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      raise exception 'Cannot delete owner membership. Transfer owner via budgets.user_id instead.';
    end if;
    return old;
  end if;

  if new.role = 'owner' and canonical_owner_id is distinct from new.user_id then
    raise exception 'Owner membership must match budgets.user_id.';
  end if;

  if tg_op = 'UPDATE'
     and old.role = 'owner'
     and (new.role <> 'owner' or new.user_id is distinct from old.user_id) then
    raise exception 'Cannot demote or reassign owner via budget_members. Transfer owner via budgets.user_id.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_budget_members_owner_invariants on public.budget_members;
create trigger trg_guard_budget_members_owner_invariants
before insert or update or delete on public.budget_members
for each row
execute function public.guard_budget_members_owner_invariants();

insert into public.budget_members (budget_id, user_id, role, invited_by)
select b.id, b.user_id, 'owner'::public.budget_role, b.user_id
from public.budgets b
where b.user_id is not null
on conflict (budget_id, user_id) do update
set role = 'owner',
    updated_at = now();

update public.budget_members bm
set role = 'admin',
    updated_at = now()
from public.budgets b
where bm.budget_id = b.id
  and bm.role = 'owner'
  and b.user_id is distinct from bm.user_id;

insert into public.budget_members (budget_id, user_id, role, invited_by)
select b.id, b.user_id, 'owner'::public.budget_role, b.user_id
from public.budgets b
where b.user_id is not null
on conflict (budget_id, user_id) do update
set role = 'owner',
    updated_at = now();

create or replace function public.sync_budget_owner_membership()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  update public.budget_members
  set role = 'admin',
      updated_at = now()
  where budget_id = new.id
    and role = 'owner'
    and user_id is distinct from new.user_id;

  insert into public.budget_members (budget_id, user_id, role, invited_by)
  values (new.id, new.user_id, 'owner', new.user_id)
  on conflict (budget_id, user_id) do update
  set role = 'owner',
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_budget_owner_membership on public.budgets;
create trigger trg_sync_budget_owner_membership
after insert or update of user_id on public.budgets
for each row
execute function public.sync_budget_owner_membership();

create or replace function public.has_budget_role(
  target_budget_id uuid,
  allowed_roles public.budget_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.budget_members bm
    where bm.budget_id = target_budget_id
      and bm.user_id = auth.uid()
      and bm.role = any (allowed_roles)
  );
$$;

create or replace function public.get_budget_owner_user_id(target_budget_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.user_id
  from public.budgets b
  where b.id = target_budget_id;
$$;

create or replace function public.list_budget_member_identities(target_budget_id uuid)
returns table (
  user_id uuid,
  role public.budget_role,
  email text,
  first_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    bm.user_id,
    bm.role,
    au.email,
    coalesce(au.raw_user_meta_data ->> 'first_name', '')
  from public.budget_members bm
  left join auth.users au on au.id = bm.user_id
  where bm.budget_id = target_budget_id
    and public.has_budget_role(
      target_budget_id,
      array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
    )
  order by bm.created_at asc;
$$;

create or replace function public.invite_budget_member_by_email(
  target_budget_id uuid,
  target_email text,
  target_role public.budget_role default 'guest'
)
returns table (
  member_user_id uuid,
  member_role public.budget_role,
  member_email text,
  member_first_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  resolved_user_id uuid;
begin
  if not public.has_budget_role(
    target_budget_id,
    array['owner', 'admin']::public.budget_role[]
  ) then
    raise exception 'You do not have permission to add budget members.';
  end if;

  if target_role = 'owner' then
    raise exception 'Cannot add owner role via invitation.';
  end if;

  normalized_email = lower(trim(target_email));
  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required.';
  end if;

  select au.id
  into resolved_user_id
  from auth.users au
  where lower(au.email) = normalized_email
  limit 1;

  if resolved_user_id is null then
    raise exception 'No user found for this email.';
  end if;

  insert into public.budget_members (budget_id, user_id, role, invited_by)
  values (target_budget_id, resolved_user_id, target_role, auth.uid())
  on conflict (budget_id, user_id) do update
  set role = excluded.role,
      invited_by = excluded.invited_by,
      updated_at = now();

  return query
  select
    bm.user_id as member_user_id,
    bm.role as member_role,
    au.email as member_email,
    coalesce(au.raw_user_meta_data ->> 'first_name', '') as member_first_name
  from public.budget_members bm
  left join auth.users au on au.id = bm.user_id
  where bm.budget_id = target_budget_id
    and bm.user_id = resolved_user_id
  limit 1;
end;
$$;

alter table public.budget_members enable row level security;

drop policy if exists budget_members_select on public.budget_members;
create policy budget_members_select
on public.budget_members
for select
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
  )
);

drop policy if exists budget_members_insert on public.budget_members;
create policy budget_members_insert
on public.budget_members
for insert
with check (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists budget_members_update on public.budget_members;
create policy budget_members_update
on public.budget_members
for update
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
)
with check (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists budget_members_delete on public.budget_members;
create policy budget_members_delete
on public.budget_members
for delete
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists budgets_owner_all on public.budgets;
drop policy if exists zones_owner_all on public.zones;
drop policy if exists wishlist_items_owner_all on public.wishlist_items;
drop policy if exists expenses_owner_all on public.expenses;

drop policy if exists budgets_select on public.budgets;
create policy budgets_select
on public.budgets
for select
using (
  public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
  )
);

drop policy if exists budgets_insert on public.budgets;
create policy budgets_insert
on public.budgets
for insert
with check (user_id = auth.uid());

drop policy if exists budgets_update on public.budgets;
create policy budgets_update
on public.budgets
for update
using (
  public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
)
with check (
  public.has_budget_role(
    id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
  and (
    public.has_budget_role(
      id,
      array['owner', 'admin']::public.budget_role[]
    )
    or user_id = public.get_budget_owner_user_id(id)
  )
);

drop policy if exists budgets_delete on public.budgets;
create policy budgets_delete
on public.budgets
for delete
using (
  public.has_budget_role(
    id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists zones_select on public.zones;
create policy zones_select
on public.zones
for select
using (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and public.has_budget_role(
        b.id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists zones_insert on public.zones;
create policy zones_insert
on public.zones
for insert
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and public.has_budget_role(
        b.id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists zones_update on public.zones;
create policy zones_update
on public.zones
for update
using (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and public.has_budget_role(
        b.id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and public.has_budget_role(
        b.id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists zones_delete on public.zones;
create policy zones_delete
on public.zones
for delete
using (
  exists (
    select 1
    from public.budgets b
    where b.id = zones.budget_id
      and public.has_budget_role(
        b.id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_items_select on public.wishlist_items;
create policy wishlist_items_select
on public.wishlist_items
for select
using (
  exists (
    select 1
    from public.zones z
    where z.id = wishlist_items.zone_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_items_insert on public.wishlist_items;
create policy wishlist_items_insert
on public.wishlist_items
for insert
with check (
  exists (
    select 1
    from public.zones z
    where z.id = wishlist_items.zone_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_items_update on public.wishlist_items;
create policy wishlist_items_update
on public.wishlist_items
for update
using (
  exists (
    select 1
    from public.zones z
    where z.id = wishlist_items.zone_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.zones z
    where z.id = wishlist_items.zone_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists wishlist_items_delete on public.wishlist_items;
create policy wishlist_items_delete
on public.wishlist_items
for delete
using (
  exists (
    select 1
    from public.zones z
    where z.id = wishlist_items.zone_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

drop policy if exists expenses_select on public.expenses;
create policy expenses_select
on public.expenses
for select
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert
on public.expenses
for insert
with check (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists expenses_update on public.expenses;
create policy expenses_update
on public.expenses
for update
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
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
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete
on public.expenses
for delete
using (
  exists (
    select 1
    from public.wishlist_items wi
    join public.zones z on z.id = wi.zone_id
    where wi.id = expenses.wishlist_item_id
      and public.has_budget_role(
        z.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

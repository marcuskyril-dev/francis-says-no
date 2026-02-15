-- Phase 9: run owner-membership sync as definer to avoid bootstrap RLS deadlock

create or replace function public.sync_budget_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
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

alter table public.project_contract_expenses enable row level security;
alter table public.project_contract_payment_milestones enable row level security;
alter table public.project_contract_payments enable row level security;

drop policy if exists project_contract_expenses_select on public.project_contract_expenses;
create policy project_contract_expenses_select
on public.project_contract_expenses
for select
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
  )
);

drop policy if exists project_contract_expenses_insert on public.project_contract_expenses;
create policy project_contract_expenses_insert
on public.project_contract_expenses
for insert
with check (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
);

drop policy if exists project_contract_expenses_update on public.project_contract_expenses;
create policy project_contract_expenses_update
on public.project_contract_expenses
for update
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
)
with check (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin', 'maintainer']::public.budget_role[]
  )
);

drop policy if exists project_contract_expenses_delete on public.project_contract_expenses;
create policy project_contract_expenses_delete
on public.project_contract_expenses
for delete
using (
  public.has_budget_role(
    budget_id,
    array['owner', 'admin']::public.budget_role[]
  )
);

drop policy if exists project_contract_payment_milestones_select on public.project_contract_payment_milestones;
create policy project_contract_payment_milestones_select
on public.project_contract_payment_milestones
for select
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payment_milestones.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payment_milestones_insert on public.project_contract_payment_milestones;
create policy project_contract_payment_milestones_insert
on public.project_contract_payment_milestones
for insert
with check (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payment_milestones.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payment_milestones_update on public.project_contract_payment_milestones;
create policy project_contract_payment_milestones_update
on public.project_contract_payment_milestones
for update
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payment_milestones.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payment_milestones.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payment_milestones_delete on public.project_contract_payment_milestones;
create policy project_contract_payment_milestones_delete
on public.project_contract_payment_milestones
for delete
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payment_milestones.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payments_select on public.project_contract_payments;
create policy project_contract_payments_select
on public.project_contract_payments
for select
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payments.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer', 'guest']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payments_insert on public.project_contract_payments;
create policy project_contract_payments_insert
on public.project_contract_payments
for insert
with check (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payments.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payments_update on public.project_contract_payments;
create policy project_contract_payments_update
on public.project_contract_payments
for update
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payments.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
)
with check (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payments.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin', 'maintainer']::public.budget_role[]
      )
  )
);

drop policy if exists project_contract_payments_delete on public.project_contract_payments;
create policy project_contract_payments_delete
on public.project_contract_payments
for delete
using (
  exists (
    select 1
    from public.project_contract_expenses pce
    where pce.id = project_contract_payments.contract_expense_id
      and public.has_budget_role(
        pce.budget_id,
        array['owner', 'admin']::public.budget_role[]
      )
  )
);

drop view if exists public.project_contract_expense_summaries_v;
create view public.project_contract_expense_summaries_v as
with milestone_totals as (
  select
    contract_expense_id,
    coalesce(sum(amount), 0)::numeric(12, 2) as milestone_total_amount
  from public.project_contract_payment_milestones
  group by contract_expense_id
),
payment_totals as (
  select
    contract_expense_id,
    coalesce(sum(amount), 0)::numeric(12, 2) as paid_to_date
  from public.project_contract_payments
  group by contract_expense_id
)
select
  pce.id,
  pce.budget_id,
  pce.expense_type,
  pce.expense_name,
  pce.expense_date,
  pce.notes,
  pce.vendor_name,
  pce.contract_total_amount,
  pce.created_at,
  pce.updated_at,
  coalesce(mt.milestone_total_amount, 0)::numeric(12, 2) as milestone_total_amount,
  coalesce(pt.paid_to_date, 0)::numeric(12, 2) as paid_to_date,
  coalesce(
    nullif(pce.contract_total_amount, 0),
    nullif(mt.milestone_total_amount, 0),
    pt.paid_to_date,
    0
  )::numeric(12, 2) as total_contract_cost,
  (
    coalesce(
      nullif(pce.contract_total_amount, 0),
      nullif(mt.milestone_total_amount, 0),
      pt.paid_to_date,
      0
    ) - coalesce(pt.paid_to_date, 0)
  )::numeric(12, 2) as remaining_balance
from public.project_contract_expenses pce
left join milestone_totals mt on mt.contract_expense_id = pce.id
left join payment_totals pt on pt.contract_expense_id = pce.id;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'project_contract_expense_type'
      and n.nspname = 'public'
  ) then
    create type public.project_contract_expense_type as enum (
      'renovation_cost',
      'variation_order',
      'external_service'
    );
  end if;
end
$$;

create table if not exists public.project_contract_expenses (
  id uuid primary key default gen_random_uuid (),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  expense_type public.project_contract_expense_type not null,
  expense_name text not null check (length(trim(expense_name)) > 0),
  expense_date timestamp with time zone null,
  notes text null,
  vendor_name text not null check (length(trim(vendor_name)) > 0),
  contract_total_amount numeric(12, 2) null check (contract_total_amount >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_project_contract_expenses_budget_id
on public.project_contract_expenses using btree (budget_id);

create index if not exists idx_project_contract_expenses_expense_date
on public.project_contract_expenses using btree (expense_date);

create table if not exists public.project_contract_payment_milestones (
  id uuid primary key default gen_random_uuid (),
  contract_expense_id uuid not null references public.project_contract_expenses (id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  percentage numeric(5, 2) null check (percentage >= 0 and percentage <= 100),
  amount numeric(12, 2) null check (amount >= 0),
  due_date timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint project_contract_payment_milestones_value_required_check check (percentage is not null or amount is not null),
  constraint project_contract_payment_milestones_expense_sequence_unique unique (contract_expense_id, sequence_number)
);

create index if not exists idx_project_contract_payment_milestones_expense_id
on public.project_contract_payment_milestones using btree (contract_expense_id);

create index if not exists idx_project_contract_payment_milestones_due_date
on public.project_contract_payment_milestones using btree (due_date);

create table if not exists public.project_contract_payments (
  id uuid primary key default gen_random_uuid (),
  contract_expense_id uuid not null references public.project_contract_expenses (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamp with time zone not null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_project_contract_payments_expense_id
on public.project_contract_payments using btree (contract_expense_id);

create index if not exists idx_project_contract_payments_paid_at
on public.project_contract_payments using btree (paid_at);

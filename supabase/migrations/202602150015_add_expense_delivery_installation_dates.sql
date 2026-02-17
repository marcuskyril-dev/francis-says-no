alter table public.expenses
add column if not exists delivery_date timestamp with time zone null,
add column if not exists installation_date timestamp with time zone null;

create index if not exists idx_expenses_delivery_date
on public.expenses using btree (delivery_date);

create index if not exists idx_expenses_installation_date
on public.expenses using btree (installation_date);

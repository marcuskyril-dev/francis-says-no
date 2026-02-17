alter table public.project_contract_expenses
  alter column expense_date drop not null,
  alter column notes drop not null;

do $$
declare
  notes_check_constraint record;
begin
  for notes_check_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.project_contract_expenses'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%trim(notes)%'
  loop
    execute format(
      'alter table public.project_contract_expenses drop constraint if exists %I',
      notes_check_constraint.conname
    );
  end loop;
end
$$;

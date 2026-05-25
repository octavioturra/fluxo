-- Add is_recurring column to incomes table
alter table public.incomes
  add column if not exists is_recurring boolean not null default false;

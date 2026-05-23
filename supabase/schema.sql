-- ============================================================
-- Orça — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  avatar text not null default 'raposa',
  dark_mode boolean not null default false,
  balance_carryover text not null default 'auto',
  savings_reminder_day integer not null default 1,
  status_threshold_maravilhoso integer not null default 20,
  status_threshold_bom integer not null default 11,
  status_threshold_atencao integer not null default 1,
  fixed_health_recomendado integer not null default 20,
  fixed_health_excelente integer not null default 30,
  fixed_health_alerta integer not null default 50,
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INCOMES
-- ============================================================
create table public.incomes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null,
  type text not null default 'clt',
  amount numeric(12,2) not null,
  day integer not null,
  month integer not null,
  year integer not null,
  is_estimated boolean not null default false,
  created_at timestamptz not null default now()
);

create index incomes_user_period on public.incomes(user_id, year, month);

-- ============================================================
-- FIXED EXPENSES
-- ============================================================
create table public.fixed_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  amount numeric(12,2) not null,
  due_day integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index fixed_expenses_user on public.fixed_expenses(user_id);

-- ============================================================
-- DAILY EXPENSES
-- ============================================================
create table public.daily_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  category text not null,
  amount numeric(12,2) not null,
  payment_method text not null default 'pix',
  credit_card_id uuid,
  installments integer,
  installment_amount numeric(12,2),
  date date not null,
  month integer not null,
  year integer not null,
  created_at timestamptz not null default now()
);

create index daily_expenses_user_period on public.daily_expenses(user_id, year, month);
create index daily_expenses_date on public.daily_expenses(user_id, date);

-- ============================================================
-- CREDIT CARDS
-- ============================================================
create table public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  closing_day integer not null,
  due_day integer not null,
  card_limit numeric(12,2),
  created_at timestamptz not null default now()
);

create index credit_cards_user on public.credit_cards(user_id);

-- ============================================================
-- SAVINGS
-- ============================================================
create table public.savings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  category_label text not null,
  amount numeric(12,2) not null,
  month integer not null,
  year integer not null,
  created_at timestamptz not null default now(),
  unique(user_id, category, month, year)
);

create index savings_user_period on public.savings(user_id, year, month);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.incomes enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.daily_expenses enable row level security;
alter table public.credit_cards enable row level security;
alter table public.savings enable row level security;

-- Profiles: user can read/update their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Generic RLS for all data tables
create policy "Users own their incomes" on public.incomes for all using (auth.uid() = user_id);
create policy "Users own their fixed_expenses" on public.fixed_expenses for all using (auth.uid() = user_id);
create policy "Users own their daily_expenses" on public.daily_expenses for all using (auth.uid() = user_id);
create policy "Users own their credit_cards" on public.credit_cards for all using (auth.uid() = user_id);
create policy "Users own their savings" on public.savings for all using (auth.uid() = user_id);

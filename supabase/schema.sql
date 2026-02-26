-- ============================================================
--  Build Saudi — Supabase Schema
--  Run this in Supabase → SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
-- create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
--  REQUESTS
-- ──────────────────────────────────────────────
create table if not exists public.requests (
  id            text        primary key,          -- e.g. #BLD-2025
  user_id       uuid        not null references auth.users(id) on delete cascade,
  product       text        not null,
  specs         text,
  project       text,
  value         text        default '—',
  date          text        default 'اليوم',
  status        text        not null default 'waiting_admin',
  wait          text,
  source        text,                              -- 'manual' | 'boq' | 'table'
  delivery_address text,
  delivery_date text,
  notes         text,
  boq_file      text,
  table_file    text,
  sheet_link    text,
  items         jsonb,
  created_at    timestamptz default now()
);

-- Row-level security: users see only their own rows
alter table public.requests enable row level security;

create policy "Users view own requests"
  on public.requests for select
  using (auth.uid() = user_id);

create policy "Users insert own requests"
  on public.requests for insert
  with check (auth.uid() = user_id);

create policy "Users update own requests"
  on public.requests for update
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
--  PAYMENT CASES
-- ──────────────────────────────────────────────
create table if not exists public.payment_cases (
  id          text        primary key,             -- e.g. #TRF-9002
  user_id     uuid        not null references auth.users(id) on delete cascade,
  request_id  text        references public.requests(id) on delete cascade,
  project     text,
  amount      text        default '—',
  date        text        default 'اليوم',
  status      text        not null default 'waiting_transfer',
  proof       text,
  created_at  timestamptz default now()
);

alter table public.payment_cases enable row level security;

create policy "Users view own payment cases"
  on public.payment_cases for select
  using (auth.uid() = user_id);

create policy "Users insert own payment cases"
  on public.payment_cases for insert
  with check (auth.uid() = user_id);

create policy "Users update own payment cases"
  on public.payment_cases for update
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
--  QUOTES  (طلبات عروض الأسعار من صفحة get-quote)
-- ──────────────────────────────────────────────
create table if not exists public.quotes (
  id                uuid        primary key default gen_random_uuid(),
  project_name      text        not null,
  client_name       text        not null,
  phone             text        not null,
  materials         text        not null,
  boq_file_url      text,
  sheet_link        text,
  delivery_address  text        not null,
  delivery_date     date        not null,
  notes             text,
  status            text        not null default 'new',
  created_at        timestamptz default now()
);

-- Public insert allowed (no auth required for quote requests)
alter table public.quotes enable row level security;

create policy "Anyone can submit a quote"
  on public.quotes for insert
  with check (true);

-- Only service role / admin can read quotes (no user-facing read needed)
create policy "Service role reads quotes"
  on public.quotes for select
  using (false);

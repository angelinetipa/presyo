-- Presyo — Phase 1 schema
-- Run this once in Supabase → SQL Editor → New query → Run.

-- ------------------------------------------------------------
-- fx_rates: one row per (day, currency). How many pesos 1 unit buys.
-- ------------------------------------------------------------
create table if not exists public.fx_rates (
  rate_date     date        not null,
  currency      text        not null,
  php_per_unit  numeric(12,6) not null,
  source        text        not null default 'open.er-api.com',
  fetched_at    timestamptz not null default now(),
  primary key (rate_date, currency)
);

create index if not exists fx_rates_currency_date_idx
  on public.fx_rates (currency, rate_date desc);

-- ------------------------------------------------------------
-- pipeline_runs: health log. Every run writes one row, pass or fail.
-- ------------------------------------------------------------
create table if not exists public.pipeline_runs (
  id             bigint generated always as identity primary key,
  pipeline       text        not null,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  status         text        not null check (status in ('running', 'success', 'failed')),
  rows_read      integer     not null default 0,
  rows_loaded    integer     not null default 0,
  rows_rejected  integer     not null default 0,
  error_message  text
);

create index if not exists pipeline_runs_started_idx
  on public.pipeline_runs (pipeline, started_at desc);

-- ------------------------------------------------------------
-- Security: anyone may read, nobody may write.
-- The pipeline writes with the service_role key, which skips RLS.
-- ------------------------------------------------------------
alter table public.fx_rates      enable row level security;
alter table public.pipeline_runs enable row level security;

drop policy if exists "public read fx_rates" on public.fx_rates;
create policy "public read fx_rates"
  on public.fx_rates for select to anon, authenticated using (true);

drop policy if exists "public read pipeline_runs" on public.pipeline_runs;
create policy "public read pipeline_runs"
  on public.pipeline_runs for select to anon, authenticated using (true);

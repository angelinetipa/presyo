# Presyo

A small data pipeline that tracks what the Philippine peso is worth, every day, on its own.

**Live:** [presyo.vercel.app](https://presyo.vercel.app)

## Status

<!-- PRESYO:START -->

**Latest rates — 10 Sep 2026**

| Currency | Pesos per unit |
|---|---|
| AED | 17.0246 |
| CAD | 45.3240 |
| GBP | 84.7145 |
| HKD | 7.9724 |
| JPY | 0.4071 |
| SAR | 16.6727 |
| SGD | 49.4552 |
| USD | 62.5228 |

**35 days collected** (06 Aug 2026 → 10 Sep 2026) · 235 rows

**Recent runs**

| Started | Status | Read | Loaded | Rejected |
|---|---|---|---|---|
| 10 Sep 2026 05:56 UTC | PASS | 8 | 8 | 0 |
| 09 Sep 2026 05:57 UTC | PASS | 8 | 8 | 0 |
| 08 Sep 2026 05:55 UTC | PASS | 8 | 8 | 0 |
| 07 Sep 2026 06:03 UTC | PASS | 8 | 8 | 0 |
| 06 Sep 2026 05:53 UTC | PASS | 8 | 8 | 0 |

<sub>Updated automatically by the daily workflow · 10 Sep 2026 05:56 UTC</sub>

<!-- PRESYO:END -->

## Why this exists

Most portfolio projects run once and stop. This one runs every morning without anyone touching it, checks its own data before saving it, and keeps a log of every run — including the runs that fail.

### Why the peso

A weaker peso means more money for a freelancer paid in dollars, and a better day to send money home for a family abroad. It also means imported goods creep up in price for everyone else. The number matters to a lot of people, but nobody watches it day to day.

Currencies tracked: **USD** (the largest remittance source, and how most freelancers are paid), **SAR, AED, SGD, HKD** (the biggest work destinations), and **JPY, GBP, CAD** (Japan and the UK are both top remittance sources; Canada is a common destination for families settling permanently).

Together these cover about **68%** of the cash sent home in 2025, by the country it came from. Source: Bangko Sentral ng Pilipinas.

## How it works

```
open.er-api.com  →  fetch  →  validate  →  upsert  →  Supabase (Postgres)
                                  ↓
                          pipeline_runs log
```

Runs daily at 9:15 AM Philippine time on GitHub Actions.

**Fetch** — one request returns every rate against the US dollar. Because the source is USD-based, pesos per riyal is calculated as `PHP per USD ÷ SAR per USD`.

**Validate** — every row is checked before it can reach the table. A row is rejected if the date is in the future, the feed has gone stale, the rate is not a positive number, the rate falls outside a sane band for that currency, or the same currency appears twice in one batch. Each rejection keeps a written reason.

**Upsert** — rows are written with `rate_date + currency` as the key, so re-running the pipeline five times in one day leaves exactly the same table as running it once.

**Log** — every run writes a row to `pipeline_runs` with how many rows were read, loaded, and rejected. Failures are recorded too, with the error message, so a silent breakage is impossible.

## Tables

| Table | What it holds |
|---|---|
| `fx_rates` | One row per day per currency: `rate_date`, `currency`, `php_per_unit`, `source` |
| `pipeline_runs` | One row per run: status, row counts, error message |

Both are readable by the public and writable only by the pipeline, using row-level security.

## Setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `sql/schema.sql`, and run it.
3. Copy `.env.example` to `.env` and fill in your project URL and service role key.
4. Install and run:

```bash
pip install -r requirements.txt
export PYTHONPATH=src        # Windows: set PYTHONPATH=src
python -m presyo.run
```

5. Push to GitHub, then add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` under **Settings → Secrets and variables → Actions**.
6. Open the **Actions** tab and run the workflow once by hand to confirm it works.

## The web page

`web/` is a small React + Vite page that reads the same two tables over Supabase's REST endpoint and deploys to Vercel.

```bash
cd web
npm install
cp .env.example .env      # fill in the URL and the ANON key
npm run dev
```

It uses the **anon** key, not the service key. That is safe: the policies in `sql/schema.sql` grant `anon` nothing but `SELECT`. The service key bypasses row-level security entirely and stays in GitHub Secrets, used only by the pipeline.

To deploy: point Vercel at this repo, set the root directory to `web`, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.

## Tests

```bash
python -m pytest -q
```

Covers the conversion maths and every validation rule. Tests run in CI before the pipeline is allowed to write anything.

## Layout

```
src/presyo/
  config.py          settings: currencies, sanity bands
  sources/fx.py      fetching and rate conversion
  validate.py        row checks, accept or reject with a reason
  db.py              Supabase upserts and run logging
  run.py             entry point
  report.py          rewrites the Status block in this README
sql/schema.sql       tables, indexes, security policies
tests/               unit tests
web/                 the public page — React + Vite, reads the same tables
```

## Roadmap

- [x] Phase 1 — daily exchange rates
- [ ] Phase 2 — weekly fuel prices
- [ ] Phase 3 — monthly rice prices and inflation
- [x] Phase 4 — public page (`web/`) and live status written into this README

---

Built by [Ma. Angeline Tipa](https://opal-portfolio.vercel.app)
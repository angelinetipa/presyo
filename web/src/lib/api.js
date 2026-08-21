// src/lib/api.js
// Reads Supabase over its REST endpoint with the anon key.
//
// No supabase-js: two GET requests do not justify a dependency, and
// plain fetch makes it obvious what is being asked for. The anon key is
// safe in the browser because the policies in sql/schema.sql grant it
// SELECT and nothing else — the pipeline writes with the service key,
// which never leaves GitHub Secrets.

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function get(path) {
  if (!URL || !KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.');
  }
  const response = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
  return response.json();
}

/** Every rate ever recorded, oldest first. */
export function fetchRates() {
  return get('fx_rates?select=rate_date,currency,php_per_unit&order=rate_date.asc');
}

/** The last few pipeline runs, newest first. */
export function fetchRuns(limit = 6) {
  return get(
    'pipeline_runs?select=started_at,status,rows_read,rows_loaded,rows_rejected'
    + `&order=started_at.desc&limit=${limit}`,
  );
}

/**
 * Reshapes flat rows into what the page needs: one object per date for
 * the chart, plus the latest value, the day-on-day move, and the move
 * since collection began, for each currency.
 */
export function shape(rows) {
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.rate_date)) byDate.set(row.rate_date, { date: row.rate_date });
    byDate.get(row.rate_date)[row.currency] = Number(row.php_per_unit);
  }
  const series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const latest = {};
  for (const currency of new Set(rows.map((r) => r.currency))) {
    const points = series.filter((d) => d[currency] != null);
    if (points.length === 0) continue;

    const now = points[points.length - 1][currency];
    const prev = points.length > 1 ? points[points.length - 2][currency] : null;
    const first = points[0][currency];

    latest[currency] = {
      value: now,
      dayChange: prev == null ? null : ((now - prev) / prev) * 100,
      sinceStart: ((now - first) / first) * 100,
      days: points.length,
    };
  }

  return { series, latest, days: series.length, lastDate: series.at(-1)?.date ?? null };
}

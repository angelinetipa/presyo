// src/lib/api.js
// Reads Supabase over its REST endpoint with the anon key.
//
// No supabase-js: two GET requests do not justify a dependency, and
// plain fetch makes it obvious what is being asked for. The anon key is
// safe in the browser because the policies in sql/schema.sql grant it
// SELECT and nothing else — the pipeline writes with the service key,
// which never leaves GitHub Secrets.

// Trailing slashes produce a double slash in the path, which Supabase
// rejects — strip it once here rather than in every call.
const URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/**
 * Says what is actually wrong with the configuration, or null if it
 * looks usable.
 *
 * The first version only checked that the variables existed. A .env
 * copied from .env.example and never filled in passes that check, then
 * fails at the network with the browser's useless "Failed to fetch" —
 * which tells you nothing about which of four possible mistakes you
 * made. Every case below is one somebody will hit.
 */
function configProblem() {
  if (!URL || !KEY) {
    return 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env, fill both in, then restart the dev server — Vite only reads .env at startup.';
  }
  if (URL.includes('yourproject') || KEY.startsWith('your-')) {
    return 'The .env file still has the placeholder values from .env.example. Replace them with your real Project URL and anon key from Supabase → Project Settings → API.';
  }
  if (/^["']|["']$/.test(URL) || /^["']|["']$/.test(KEY)) {
    return 'Remove the quotes around the values in .env. Write VITE_SUPABASE_URL=https://abc.supabase.co with no quote marks.';
  }
  if (!URL.startsWith('https://')) {
    return `VITE_SUPABASE_URL should start with https:// — it is currently "${URL}".`;
  }
  return null;
}

async function get(path) {
  const problem = configProblem();
  if (problem) throw new Error(problem);

  const endpoint = `${URL}/rest/v1/${path}`;
  let response;

  try {
    response = await fetch(endpoint, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
  } catch {
    // fetch only throws for network-level failures: bad host, no
    // connection, blocked request. An HTTP error status does not land here.
    throw new Error(
      `Could not reach ${URL}. Check the project URL is spelled correctly and that the Supabase project is not paused.`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'Supabase rejected the key. Check you used the anon public key, and that the read policies in sql/schema.sql have been run.',
    );
  }
  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status} for ${path}`);
  }
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